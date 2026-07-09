package com.xebia.portal.service.impl;

import com.xebia.portal.dto.request.SubmissionRequests;
import com.xebia.portal.dto.response.SubmissionResultResponse;
import com.xebia.portal.dto.response.SubmissionResponse;
import com.xebia.portal.entity.*;
import com.xebia.portal.entity.Enums.AssessmentStatus;
import com.xebia.portal.entity.Enums.QuestionType;
import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.entity.Enums.SubmissionStatus;
import com.xebia.portal.exception.BadRequestException;
import com.xebia.portal.exception.ResourceNotFoundException;
import com.xebia.portal.exception.UnauthorizedException;
import com.xebia.portal.mapper.PortalMapper;
import com.xebia.portal.repository.AssessmentDraftRepository;
import com.xebia.portal.repository.AssessmentRepository;
import com.xebia.portal.repository.SubmissionRepository;
import com.xebia.portal.service.CurrentUserService;
import com.xebia.portal.service.SubmissionService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
public class SubmissionServiceImpl implements SubmissionService {
    private final SubmissionRepository submissionRepository;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentDraftRepository draftRepository;
    private final CurrentUserService currentUserService;
    private final PortalMapper mapper;

    public SubmissionServiceImpl(SubmissionRepository submissionRepository, AssessmentRepository assessmentRepository,
                                 AssessmentDraftRepository draftRepository, CurrentUserService currentUserService, PortalMapper mapper) {
        this.submissionRepository = submissionRepository;
        this.assessmentRepository = assessmentRepository;
        this.draftRepository = draftRepository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public SubmissionResponse start(SubmissionRequests.StartSubmissionRequest request) {
        var student = currentUserService.requireCurrentUser();
        var assessment = assessmentRepository.findById(request.assessmentId()).orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));
        validateCanStart(student, assessment);
        var existing = submissionRepository.findFirstByAssessmentIdAndStudentIdAndStatus(request.assessmentId(), student.getId(), SubmissionStatus.STARTED);
        if (existing.isPresent()) return mapper.toSubmissionResponse(existing.get());
        long attempts = submissionRepository.countByAssessmentIdAndStudentId(assessment.getId(), student.getId());
        int maxAttempts = assessment.getMaxAttempts() == null ? 1 : assessment.getMaxAttempts();
        if (attempts >= maxAttempts) {
            throw new BadRequestException("Maximum assessment attempts exceeded");
        }
        Submission submission = new Submission();
        submission.setAssessment(assessment);
        submission.setStudent(student);
        submission.setStatus(SubmissionStatus.STARTED);
        submission.setStartedAt(Instant.now());
        return mapper.toSubmissionResponse(submissionRepository.save(submission));
    }

    @Override
    @Transactional
    public SubmissionResponse submit(UUID id, SubmissionRequests.SubmitSubmissionRequest request) {
        Submission submission = findSubmission(id);
        ensureStudentOwns(submission);
        if (submission.getStatus() != SubmissionStatus.STARTED) {
            throw new BadRequestException("Submission has already been submitted");
        }
        validateSubmissionWindow(submission.getAssessment());
        List<SubmissionRequests.AnswerRequest> answers = request.answers() == null ? List.of() : request.answers();
        validateAnswers(submission.getAssessment(), answers);
        submission.getAnswers().clear();
        BigDecimal score = BigDecimal.ZERO;
        boolean fullyAutoEvaluated = true;
        Map<UUID, Question> questionsById = submission.getAssessment().getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, Function.identity()));
        for (SubmissionRequests.AnswerRequest ar : answers) {
            Question question = questionsById.get(ar.questionId());
            SubmissionAnswer answer = new SubmissionAnswer();
            answer.setSubmission(submission);
            answer.setQuestion(question);
            answer.setAnswerText(ar.answerText());
            answer.setAnswerJson(ar.answerJson());
            BigDecimal marks = autoGrade(question, ar);
            if (marks == null) {
                fullyAutoEvaluated = false;
                marks = BigDecimal.ZERO;
            } else {
                answer.setReviewed(true);
                answer.setCorrect(marks.compareTo(BigDecimal.ZERO) > 0);
            }
            answer.setMarksAwarded(marks);
            score = score.add(marks);
            submission.getAnswers().add(answer);
        }
        submission.setStatus(fullyAutoEvaluated ? SubmissionStatus.EVALUATED : SubmissionStatus.SUBMITTED);
        submission.setEvaluated(fullyAutoEvaluated);
        submission.setSubmittedAt(Instant.now());
        submission.setTimeTaken(request.timeTaken());
        submission.setScore(score);
        Integer total = submission.getAssessment().getMarks();
        submission.setPercentage(total == null || total == 0 ? BigDecimal.ZERO : score.multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP));
        Submission saved = submissionRepository.save(submission);
        draftRepository.findByAssessmentIdAndStudentId(saved.getAssessment().getId(), saved.getStudent().getId())
                .ifPresent(draftRepository::delete);
        return mapper.toSubmissionResponse(saved);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissions(UUID studentId, UUID assessmentId, SubmissionStatus status) {
        var currentUser = currentUserService.requireCurrentUser();
        List<Submission> submissions;
        if (currentUser.getRole() == Role.STUDENT) {
            submissions = submissionRepository.findByStudentId(currentUser.getId());
        } else {
            submissions = studentId == null
                    ? submissionRepository.findByAssessmentCreatedById(currentUser.getId())
                    : submissionRepository.findByStudentIdAndAssessmentCreatedById(studentId, currentUser.getId());
        }
        return submissions.stream()
                .filter(submission -> assessmentId == null || submission.getAssessment().getId().equals(assessmentId))
                .filter(submission -> status == null || submission.getStatus() == status)
                .map(mapper::toSubmissionResponse)
                .toList();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public SubmissionResultResponse getResult(UUID id) {
        Submission submission = findSubmission(id);
        User currentUser = currentUserService.requireCurrentUser();
        ensureCanRead(submission, currentUser);
        boolean includeCorrectDetails = currentUser.getRole() == Role.TEACHER || submission.getStatus() == SubmissionStatus.EVALUATED;
        return mapper.toSubmissionResultResponse(submission, includeCorrectDetails);
    }

    @Override
    @Transactional
    public SubmissionResponse evaluate(UUID id, SubmissionRequests.EvaluationRequest request) {
        Submission submission = findSubmission(id);
        ensureTeacherOwnsAssessment(submission);
        if (submission.getStatus() != SubmissionStatus.SUBMITTED) {
            throw new BadRequestException("Only submitted, non-evaluated submissions can be evaluated");
        }
        List<SubmissionRequests.QuestionEvaluationRequest> evaluations = request.questionEvaluations();
        validateEvaluationRequest(submission, evaluations);
        for (SubmissionAnswer answer : submission.getAnswers()) {
            evaluations.stream()
                    .filter(item -> item.questionId().equals(answer.getQuestion().getId()))
                    .findFirst()
                    .ifPresent(item -> {
                        answer.setMarksAwarded(item.marksAwarded());
                        answer.setRemarks(item.remarks());
                        answer.setReviewed(true);
                        answer.setCorrect(answer.getMarksAwarded().compareTo(BigDecimal.ZERO) > 0);
                    });
        }
        BigDecimal total = submission.getAnswers().stream()
                .map(SubmissionAnswer::getMarksAwarded)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        submission.setScore(total);
        Integer max = submission.getAssessment().getMarks();
        submission.setPercentage(max == null || max == 0 ? BigDecimal.ZERO : total.multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(max), 2, RoundingMode.HALF_UP));
        submission.setStatus(SubmissionStatus.EVALUATED);
        submission.setEvaluated(true);
        submission.setRemarks(request.overallRemarks());
        submission.setEvaluatedBy(currentUserService.requireCurrentUser());
        submission.setEvaluatedAt(Instant.now());
        return mapper.toSubmissionResponse(submissionRepository.save(submission));
    }

    private BigDecimal autoGrade(Question question, SubmissionRequests.AnswerRequest answer) {
        if (question.getType() == QuestionType.MCQ || question.getType() == QuestionType.TRUE_FALSE) {
            return question.getCorrectAnswer() != null && question.getCorrectAnswer().equalsIgnoreCase(trimToEmpty(answer.answerText()))
                    ? BigDecimal.valueOf(marksFor(question)) : BigDecimal.ZERO;
        }
        if (question.getType() == QuestionType.MULTIPLE_SELECT) {
            return !parseMultiValueAnswer(question.getCorrectAnswer()).isEmpty()
                    && parseMultiValueAnswer(question.getCorrectAnswer()).equals(parseMultiValueAnswer(answer.answerJson() == null ? answer.answerText() : answer.answerJson()))
                    ? BigDecimal.valueOf(marksFor(question)) : BigDecimal.ZERO;
        }
        return null;
    }

    private Submission findSubmission(UUID id) {
        return submissionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
    }

    private void ensureStudentOwns(Submission submission) {
        User currentUser = currentUserService.requireCurrentUser();
        if (currentUser.getRole() == Role.STUDENT && !submission.getStudent().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Students can access only their own submissions");
        }
    }

    private void ensureCanRead(Submission submission, User currentUser) {
        if (currentUser.getRole() == Role.STUDENT) {
            ensureStudentOwns(submission);
            return;
        }
        ensureTeacherOwnsAssessment(submission, currentUser);
    }

    private void ensureTeacherOwnsAssessment(Submission submission) {
        ensureTeacherOwnsAssessment(submission, currentUserService.requireCurrentUser());
    }

    private void ensureTeacherOwnsAssessment(Submission submission, User teacher) {
        if (teacher.getRole() != Role.TEACHER) {
            throw new UnauthorizedException("Teacher access required");
        }
        User createdBy = submission.getAssessment().getCreatedBy();
        if (createdBy != null && !createdBy.getId().equals(teacher.getId())) {
            throw new UnauthorizedException("Teachers can access only submissions for their own assessments");
        }
    }

    private void validateEvaluationRequest(Submission submission, List<SubmissionRequests.QuestionEvaluationRequest> evaluations) {
        Map<UUID, SubmissionAnswer> answersByQuestionId = submission.getAnswers().stream()
                .collect(Collectors.toMap(answer -> answer.getQuestion().getId(), Function.identity()));
        Set<UUID> evaluationQuestionIds = new LinkedHashSet<>();
        for (SubmissionRequests.QuestionEvaluationRequest evaluation : evaluations) {
            if (!evaluationQuestionIds.add(evaluation.questionId())) {
                throw new BadRequestException("Duplicate evaluation for question: " + evaluation.questionId());
            }
            SubmissionAnswer answer = answersByQuestionId.get(evaluation.questionId());
            if (answer == null) {
                throw new BadRequestException("Evaluation question does not belong to this submission: " + evaluation.questionId());
            }
            BigDecimal maxMarks = BigDecimal.valueOf(marksFor(answer.getQuestion()));
            if (evaluation.marksAwarded().compareTo(maxMarks) > 0) {
                throw new BadRequestException("Marks awarded cannot exceed question marks for question: " + evaluation.questionId());
            }
        }
    }

    private void validateCanStart(User student, Assessment assessment) {
        if (assessment.getStatus() != AssessmentStatus.PUBLISHED) {
            throw new BadRequestException("Only published assessments can be started");
        }
        validateSubmissionWindow(assessment);
        if (!isAssignedToStudent(assessment, student.getId())) {
            throw new UnauthorizedException("Student can start only assigned assessments");
        }
    }

    private void validateSubmissionWindow(Assessment assessment) {
        Instant now = Instant.now();
        if (assessment.getStartAt() != null && now.isBefore(assessment.getStartAt())) {
            throw new BadRequestException("Assessment has not started yet");
        }
        if (assessment.getEndAt() != null && now.isAfter(assessment.getEndAt())) {
            throw new BadRequestException("Assessment has already ended");
        }
    }

    private boolean isAssignedToStudent(Assessment assessment, UUID studentId) {
        return assessment.getAssignedBatches().stream()
                .anyMatch(link -> link.getBatch().getStudents().stream()
                        .anyMatch(batchStudent -> batchStudent.getStudent().getId().equals(studentId)));
    }

    private void validateAnswers(Assessment assessment, List<SubmissionRequests.AnswerRequest> answers) {
        Map<UUID, Question> questionsById = assessment.getQuestions().stream()
                .collect(Collectors.toMap(Question::getId, Function.identity()));
        Set<UUID> answeredQuestionIds = new LinkedHashSet<>();
        for (SubmissionRequests.AnswerRequest answer : answers) {
            if (!questionsById.containsKey(answer.questionId())) {
                throw new BadRequestException("Answer question does not belong to this assessment: " + answer.questionId());
            }
            if (!answeredQuestionIds.add(answer.questionId())) {
                throw new BadRequestException("Duplicate answer for question: " + answer.questionId());
            }
        }
        for (Question question : assessment.getQuestions()) {
            if (question.isRequired() && !answeredQuestionIds.contains(question.getId())) {
                throw new BadRequestException("Required question is missing an answer: " + question.getId());
            }
        }
        for (SubmissionRequests.AnswerRequest answer : answers) {
            Question question = questionsById.get(answer.questionId());
            if (question.isRequired() && !hasAnswerContent(answer)) {
                throw new BadRequestException("Required question answer is empty: " + answer.questionId());
            }
        }
    }

    private Set<String> parseMultiValueAnswer(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }
        String cleaned = value.trim()
                .replace("[", "")
                .replace("]", "")
                .replace("\"", "")
                .replace("'", "");
        return Arrays.stream(cleaned.split("[|,]"))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .map(String::toLowerCase)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean hasAnswerContent(SubmissionRequests.AnswerRequest answer) {
        return (answer.answerText() != null && !answer.answerText().isBlank())
                || (answer.answerJson() != null && !answer.answerJson().isBlank());
    }

    private int marksFor(Question question) {
        return question.getMarks() == null ? 0 : question.getMarks();
    }
}
