package com.xebia.portal.service.impl;

import com.xebia.portal.dto.response.DashboardResponses;
import com.xebia.portal.dto.response.LeaderboardResponse;
import com.xebia.portal.dto.response.ReportResponses;
import com.xebia.portal.entity.*;
import com.xebia.portal.entity.Enums.AssessmentStatus;
import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.entity.Enums.SubmissionStatus;
import com.xebia.portal.exception.UnauthorizedException;
import com.xebia.portal.repository.AssessmentRepository;
import com.xebia.portal.repository.BatchRepository;
import com.xebia.portal.repository.SubmissionRepository;
import com.xebia.portal.repository.UserRepository;
import com.xebia.portal.service.AnalyticsService;
import com.xebia.portal.service.CurrentUserService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {
    private final UserRepository userRepository;
    private final BatchRepository batchRepository;
    private final AssessmentRepository assessmentRepository;
    private final SubmissionRepository submissionRepository;
    private final CurrentUserService currentUserService;

    public AnalyticsServiceImpl(UserRepository userRepository, BatchRepository batchRepository,
                                AssessmentRepository assessmentRepository, SubmissionRepository submissionRepository,
                                CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.batchRepository = batchRepository;
        this.assessmentRepository = assessmentRepository;
        this.submissionRepository = submissionRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DashboardResponses.TeacherDashboardResponse teacherDashboard() {
        User teacher = requireTeacher();
        List<Batch> batches = teacherBatches(teacher);
        List<Assessment> assessments = teacherAssessments(teacher);
        List<Submission> submissions = teacherSubmissions(teacher);
        List<User> students = studentsInBatches(batches);
        List<Submission> evaluated = evaluated(submissions);
        List<DashboardResponses.SubmissionSummary> recent = submissions.stream()
                .sorted(Comparator.comparing(this::submissionSortInstant).reversed())
                .limit(5)
                .map(this::toSubmissionSummary)
                .toList();
        List<DashboardResponses.AssessmentSummary> active = assessments.stream()
                .filter(this::isActiveAssessment)
                .map(assessment -> new DashboardResponses.AssessmentSummary(assessment.getId(), assessment.getTitle(), null, false))
                .toList();
        return new DashboardResponses.TeacherDashboardResponse(students.size(), batches.size(), assessments.size(),
                submissions.size(), pendingEvaluations(submissions), averagePercentage(evaluated), recent, active,
                submissionTrend(submissions));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DashboardResponses.StudentDashboardResponse studentDashboard() {
        User student = requireStudent();
        List<Assessment> assigned = assignedAssessmentsForStudent(student);
        List<Submission> submissions = submissionRepository.findByStudentId(student.getId());
        List<Submission> evaluated = evaluated(submissions);
        List<DashboardResponses.AssessmentSummary> recentScores = evaluated.stream()
                .sorted(Comparator.comparing(this::submissionSortInstant).reversed())
                .limit(5)
                .map(submission -> new DashboardResponses.AssessmentSummary(submission.getAssessment().getId(),
                        submission.getAssessment().getTitle(), safe(submission.getPercentage()), submission.isEvaluated()))
                .toList();
        List<DashboardResponses.AssessmentSummary> activeAssessments = assigned.stream()
                .filter(this::isActiveAssessment)
                .map(assessment -> new DashboardResponses.AssessmentSummary(assessment.getId(), assessment.getTitle(), null, false))
                .toList();
        Integer rank = leaderboard(null, null).stream()
                .filter(item -> item.studentId().equals(student.getId()))
                .map(LeaderboardResponse::rank)
                .findFirst()
                .orElse(null);
        return new DashboardResponses.StudentDashboardResponse(activeAssessments.size(),
                assigned.stream().filter(this::isUpcomingAssessment).count(), completedSubmissions(submissions),
                pendingEvaluations(submissions), averagePercentage(evaluated), bestPercentage(evaluated), rank,
                recentScores, activeAssessments);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ReportResponses.OverviewReportResponse overviewReport() {
        User teacher = requireTeacher();
        List<Assessment> assessments = teacherAssessments(teacher);
        List<Submission> submissions = teacherSubmissions(teacher);
        List<Submission> evaluated = evaluated(submissions);
        return new ReportResponses.OverviewReportResponse(assessments.size(), submissions.size(), evaluated.size(),
                pendingEvaluations(submissions), averagePercentage(evaluated), bestPercentage(evaluated),
                lowestPercentage(evaluated), passRate(evaluated), scoreDistribution(evaluated));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ReportResponses.BatchReportResponse> batchReports() {
        User teacher = requireTeacher();
        List<Assessment> assessments = teacherAssessments(teacher);
        List<Submission> submissions = teacherSubmissions(teacher);
        return teacherBatches(teacher).stream()
                .map(batch -> {
                    Set<UUID> studentIds = batch.getStudents().stream().map(item -> item.getStudent().getId()).collect(Collectors.toSet());
                    List<Assessment> assignedAssessments = assessments.stream()
                            .filter(assessment -> assessmentAssignedToBatch(assessment, batch.getId()))
                            .toList();
                    Set<UUID> assessmentIds = assignedAssessments.stream().map(Assessment::getId).collect(Collectors.toSet());
                    List<Submission> batchSubmissions = submissions.stream()
                            .filter(submission -> studentIds.contains(submission.getStudent().getId()))
                            .filter(submission -> assessmentIds.contains(submission.getAssessment().getId()))
                            .toList();
                    return new ReportResponses.BatchReportResponse(batch.getId(), batch.getName(), studentIds.size(),
                            assignedAssessments.size(), batchSubmissions.size(), averagePercentage(evaluated(batchSubmissions)),
                            passRate(evaluated(batchSubmissions)));
                })
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ReportResponses.StudentReportResponse> studentReports(UUID batchId, UUID assessmentId, String search) {
        User teacher = requireTeacher();
        List<Batch> batches = teacherBatches(teacher);
        List<Submission> submissions = teacherSubmissions(teacher);
        if (assessmentId != null) {
            submissions = submissions.stream().filter(item -> item.getAssessment().getId().equals(assessmentId)).toList();
        }
        List<Submission> filteredSubmissions = submissions;
        String normalizedSearch = search == null ? null : search.trim().toLowerCase(Locale.ROOT);
        return studentsInBatches(batches).stream()
                .filter(student -> batchId == null || batchesForStudent(batches, student.getId()).stream().anyMatch(batch -> batch.getId().equals(batchId)))
                .filter(student -> normalizedSearch == null || student.getName().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || student.getEmail().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                .map(student -> toStudentReport(student, batchesForStudent(batches, student.getId()),
                        filteredSubmissions.stream().filter(item -> item.getStudent().getId().equals(student.getId())).toList()))
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<LeaderboardResponse> leaderboard(UUID batchId, UUID assessmentId) {
        User currentUser = currentUserService.requireCurrentUser();
        List<Batch> visibleBatches = currentUser.getRole() == Role.TEACHER ? teacherBatches(currentUser) : batchesForStudent(batchRepository.findAll(), currentUser.getId());
        if (batchId != null) {
            visibleBatches = visibleBatches.stream().filter(batch -> batch.getId().equals(batchId)).toList();
        }
        List<Batch> filteredVisibleBatches = visibleBatches;
        Set<UUID> visibleStudentIds = studentsInBatches(visibleBatches).stream().map(User::getId).collect(Collectors.toSet());
        List<Submission> visibleSubmissions = currentUser.getRole() == Role.TEACHER
                ? teacherSubmissions(currentUser)
                : submissionRepository.findAll().stream()
                .filter(submission -> visibleStudentIds.contains(submission.getStudent().getId()))
                .toList();
        if (assessmentId != null) {
            visibleSubmissions = visibleSubmissions.stream().filter(item -> item.getAssessment().getId().equals(assessmentId)).toList();
        }
        List<Submission> filteredVisibleSubmissions = visibleSubmissions;
        List<LeaderboardRow> rows = studentsInBatches(filteredVisibleBatches).stream()
                .map(student -> toLeaderboardRow(student, batchesForStudent(filteredVisibleBatches, student.getId()),
                        filteredVisibleSubmissions.stream().filter(item -> item.getStudent().getId().equals(student.getId())).toList(),
                        currentUser.getRole() == Role.TEACHER || student.getId().equals(currentUser.getId())))
                .sorted(Comparator.comparing(LeaderboardRow::averageScore).reversed().thenComparing(LeaderboardRow::studentName))
                .toList();
        AtomicInteger rank = new AtomicInteger(1);
        return rows.stream()
                .map(row -> new LeaderboardResponse(rank.getAndIncrement(), row.studentId(), row.studentName(), row.email(),
                        row.avatarUrl(), row.batchNames(), row.totalScore(), row.averageScore(), row.bestScore(), row.completedAssessments()))
                .toList();
    }

    private User requireTeacher() {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() != Role.TEACHER) {
            throw new UnauthorizedException("Teacher access required");
        }
        return user;
    }

    private User requireStudent() {
        User user = currentUserService.requireCurrentUser();
        if (user.getRole() != Role.STUDENT) {
            throw new UnauthorizedException("Student access required");
        }
        return user;
    }

    private List<Batch> teacherBatches(User teacher) {
        return batchRepository.findAll().stream()
                .filter(batch -> batch.getCreatedBy() != null && batch.getCreatedBy().getId().equals(teacher.getId()))
                .toList();
    }

    private List<Assessment> teacherAssessments(User teacher) {
        return assessmentRepository.findByCreatedById(teacher.getId());
    }

    private List<Submission> teacherSubmissions(User teacher) {
        return submissionRepository.findByAssessmentCreatedById(teacher.getId());
    }

    private List<User> studentsInBatches(List<Batch> batches) {
        Map<UUID, User> students = new LinkedHashMap<>();
        for (Batch batch : batches) {
            for (BatchStudent link : batch.getStudents()) {
                students.putIfAbsent(link.getStudent().getId(), link.getStudent());
            }
        }
        return new ArrayList<>(students.values());
    }

    private List<Batch> batchesForStudent(List<Batch> batches, UUID studentId) {
        return batches.stream()
                .filter(batch -> batch.getStudents().stream().anyMatch(link -> link.getStudent().getId().equals(studentId)))
                .toList();
    }

    private List<Assessment> assignedAssessmentsForStudent(User student) {
        return assessmentRepository.findByStatus(AssessmentStatus.PUBLISHED).stream()
                .filter(assessment -> assessment.getAssignedBatches().stream()
                        .anyMatch(link -> link.getBatch().getStudents().stream()
                                .anyMatch(batchStudent -> batchStudent.getStudent().getId().equals(student.getId()))))
                .toList();
    }

    private boolean assessmentAssignedToBatch(Assessment assessment, UUID batchId) {
        return assessment.getAssignedBatches().stream().anyMatch(link -> link.getBatch().getId().equals(batchId));
    }

    private boolean isActiveAssessment(Assessment assessment) {
        Instant now = Instant.now();
        return assessment.getStatus() == AssessmentStatus.PUBLISHED
                && (assessment.getStartAt() == null || !now.isBefore(assessment.getStartAt()))
                && (assessment.getEndAt() == null || !now.isAfter(assessment.getEndAt()));
    }

    private boolean isUpcomingAssessment(Assessment assessment) {
        return assessment.getStatus() == AssessmentStatus.PUBLISHED
                && assessment.getStartAt() != null
                && Instant.now().isBefore(assessment.getStartAt());
    }

    private List<Submission> evaluated(List<Submission> submissions) {
        return submissions.stream().filter(Submission::isEvaluated).toList();
    }

    private long pendingEvaluations(List<Submission> submissions) {
        return submissions.stream().filter(item -> item.getStatus() == SubmissionStatus.SUBMITTED && !item.isEvaluated()).count();
    }

    private long completedSubmissions(List<Submission> submissions) {
        return submissions.stream().filter(item -> item.getStatus() == SubmissionStatus.SUBMITTED || item.getStatus() == SubmissionStatus.EVALUATED).count();
    }

    private DashboardResponses.SubmissionSummary toSubmissionSummary(Submission submission) {
        return new DashboardResponses.SubmissionSummary(submission.getId(), submission.getAssessment().getId(),
                submission.getAssessment().getTitle(), submission.getStudent().getId(), submission.getStudent().getName(),
                safe(submission.getPercentage()), submission.getStatus().name());
    }

    private ReportResponses.StudentReportResponse toStudentReport(User student, List<Batch> batches, List<Submission> submissions) {
        List<Submission> evaluated = evaluated(submissions);
        return new ReportResponses.StudentReportResponse(student.getId(), student.getName(), student.getEmail(),
                averagePercentage(evaluated), bestPercentage(evaluated), submissions.size(), completedSubmissions(submissions),
                evaluated.size(), pendingEvaluations(submissions), batches.stream().map(Batch::getId).toList(),
                batches.stream().map(Batch::getName).toList());
    }

    private LeaderboardRow toLeaderboardRow(User student, List<Batch> batches, List<Submission> submissions, boolean includeEmail) {
        List<Submission> evaluated = evaluated(submissions);
        BigDecimal total = evaluated.stream().map(Submission::getScore).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new LeaderboardRow(student.getId(), student.getName(), includeEmail ? student.getEmail() : null,
                student.getAvatarUrl(), batches.stream().map(Batch::getName).toList(), total,
                averagePercentage(evaluated), bestPercentage(evaluated), evaluated.size());
    }

    private List<DashboardResponses.MetricPoint> submissionTrend(List<Submission> submissions) {
        Map<LocalDate, Long> counts = submissions.stream()
                .collect(Collectors.groupingBy(item -> submissionSortInstant(item).atZone(ZoneOffset.UTC).toLocalDate(),
                        TreeMap::new, Collectors.counting()));
        return counts.entrySet().stream()
                .map(entry -> new DashboardResponses.MetricPoint(entry.getKey().toString(), BigDecimal.valueOf(entry.getValue())))
                .toList();
    }

    private List<ReportResponses.ScoreBucket> scoreDistribution(List<Submission> submissions) {
        long b0 = countInRange(submissions, 0, 39);
        long b40 = countInRange(submissions, 40, 59);
        long b60 = countInRange(submissions, 60, 79);
        long b80 = countInRange(submissions, 80, 100);
        return List.of(new ReportResponses.ScoreBucket("0-39", b0),
                new ReportResponses.ScoreBucket("40-59", b40),
                new ReportResponses.ScoreBucket("60-79", b60),
                new ReportResponses.ScoreBucket("80-100", b80));
    }

    private long countInRange(List<Submission> submissions, int min, int max) {
        return submissions.stream()
                .map(Submission::getPercentage)
                .filter(Objects::nonNull)
                .filter(value -> value.compareTo(BigDecimal.valueOf(min)) >= 0 && value.compareTo(BigDecimal.valueOf(max)) <= 0)
                .count();
    }

    private BigDecimal averagePercentage(List<Submission> submissions) {
        return average(submissions.stream().map(Submission::getPercentage).filter(Objects::nonNull).toList());
    }

    private BigDecimal bestPercentage(List<Submission> submissions) {
        return submissions.stream().map(Submission::getPercentage).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
    }

    private BigDecimal lowestPercentage(List<Submission> submissions) {
        return submissions.stream().map(Submission::getPercentage).filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
    }

    private BigDecimal passRate(List<Submission> submissions) {
        List<Submission> withPassingMarks = submissions.stream().filter(item -> item.getAssessment().getPassingMarks() != null).toList();
        if (withPassingMarks.isEmpty()) {
            return BigDecimal.ZERO;
        }
        long passed = withPassingMarks.stream()
                .filter(item -> safe(item.getScore()).compareTo(BigDecimal.valueOf(item.getAssessment().getPassingMarks())) >= 0)
                .count();
        return BigDecimal.valueOf(passed).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(withPassingMarks.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal average(List<BigDecimal> values) {
        if (values == null || values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Instant submissionSortInstant(Submission submission) {
        if (submission.getSubmittedAt() != null) {
            return submission.getSubmittedAt();
        }
        if (submission.getStartedAt() != null) {
            return submission.getStartedAt();
        }
        return Instant.EPOCH;
    }

    private record LeaderboardRow(UUID studentId, String studentName, String email, String avatarUrl,
                                  List<String> batchNames, BigDecimal totalScore, BigDecimal averageScore,
                                  BigDecimal bestScore, long completedAssessments) {
    }
}
