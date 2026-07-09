package com.xebia.portal.service.impl;

import com.xebia.portal.dto.request.CodingRequests;
import com.xebia.portal.dto.response.CodingResponses;
import com.xebia.portal.entity.Assessment;
import com.xebia.portal.entity.CodingQuestionDetails;
import com.xebia.portal.entity.CodingSubmission;
import com.xebia.portal.entity.CodingTestCase;
import com.xebia.portal.entity.CodingTestResult;
import com.xebia.portal.entity.CodingTemplate;
import com.xebia.portal.entity.Enums.AssessmentStatus;
import com.xebia.portal.entity.Enums.AssessmentType;
import com.xebia.portal.entity.Enums.QuestionType;
import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.entity.Enums.SubmissionStatus;
import com.xebia.portal.entity.Question;
import com.xebia.portal.entity.Submission;
import com.xebia.portal.entity.User;
import com.xebia.portal.exception.BadRequestException;
import com.xebia.portal.exception.ResourceNotFoundException;
import com.xebia.portal.exception.UnauthorizedException;
import com.xebia.portal.mapper.PortalMapper;
import com.xebia.portal.repository.CodingSubmissionRepository;
import com.xebia.portal.repository.QuestionRepository;
import com.xebia.portal.repository.SubmissionRepository;
import com.xebia.portal.service.CodingSubmissionService;
import com.xebia.portal.service.CurrentUserService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CodingSubmissionServiceImpl implements CodingSubmissionService {
    private final CodingSubmissionRepository codingSubmissionRepository;
    private final QuestionRepository questionRepository;
    private final SubmissionRepository submissionRepository;
    private final CurrentUserService currentUserService;
    private final PortalMapper mapper;

    public CodingSubmissionServiceImpl(CodingSubmissionRepository codingSubmissionRepository, QuestionRepository questionRepository,
                                       SubmissionRepository submissionRepository, CurrentUserService currentUserService, PortalMapper mapper) {
        this.codingSubmissionRepository = codingSubmissionRepository;
        this.questionRepository = questionRepository;
        this.submissionRepository = submissionRepository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public CodingResponses.RunCodeResponse run(CodingRequests.RunCodeRequest request) {
        User student = currentUserService.requireCurrentUser();
        Question question = requireRunnableQuestion(request.assessmentId(), request.questionId(), student);
        validateLanguage(question, request.language());
        // TODO: Replace this with a real isolated code execution sandbox. Never execute submitted code inside this API process.
        List<CodingResponses.TestResultResponse> results = placeholderResults(question.getCodingDetails());
        return new CodingResponses.RunCodeResponse("PLACEHOLDER_RUN", true, "Sandbox execution is not enabled yet.",
                BigDecimal.valueOf(0.05), BigDecimal.valueOf(16.0), results,
                "Placeholder execution only. Submitted code was validated but not executed.");
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public CodingResponses.CodingSubmissionResponse submit(CodingRequests.CodingSubmissionRequest request) {
        User student = currentUserService.requireCurrentUser();
        Question question = requireRunnableQuestion(request.assessmentId(), request.questionId(), student);
        validateLanguage(question, request.language());
        Submission parentSubmission = resolveParentSubmission(request, question.getAssessment(), student);
        CodingSubmission submission = new CodingSubmission();
        submission.setQuestion(question);
        submission.setStudent(student);
        submission.setSubmission(parentSubmission);
        submission.setLanguage(request.language().trim());
        submission.setCode(request.code());
        submission.setScore(BigDecimal.ZERO);
        submission.setStatus("PENDING_SECURE_SANDBOX");
        submission.setMemoryUsed(BigDecimal.ZERO);
        submission.setTimeTaken(0);
        submission.setSubmittedAt(Instant.now());
        addPlaceholderTestResults(submission, question.getCodingDetails());
        return mapper.toCodingSubmissionResponse(codingSubmissionRepository.save(submission));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CodingResponses.CodingSubmissionResponse> list(UUID assessmentId, UUID studentId, UUID questionId) {
        var currentUser = currentUserService.requireCurrentUser();
        if (currentUser.getRole() == Role.STUDENT && studentId != null && !studentId.equals(currentUser.getId())) {
            throw new UnauthorizedException("Students can access only their own coding submissions");
        }
        return codingSubmissionRepository.findAll().stream()
                .filter(item -> canReadCodingSubmission(item, currentUser))
                .filter(item -> currentUser.getRole() != Role.STUDENT || item.getStudent().getId().equals(currentUser.getId()))
                .filter(item -> studentId == null || item.getStudent().getId().equals(studentId))
                .filter(item -> assessmentId == null || item.getQuestion().getAssessment().getId().equals(assessmentId))
                .filter(item -> questionId == null || item.getQuestion().getId().equals(questionId))
                .map(mapper::toCodingSubmissionResponse)
                .toList();
    }

    private Question requireRunnableQuestion(UUID assessmentId, UUID questionId, User student) {
        if (student.getRole() != Role.STUDENT) {
            throw new UnauthorizedException("Only students can run or submit code");
        }
        Question question = questionRepository.findById(questionId).orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        Assessment assessment = question.getAssessment();
        if (!assessment.getId().equals(assessmentId)) {
            throw new BadRequestException("Question does not belong to the requested assessment");
        }
        if (question.getType() != QuestionType.CODING) {
            throw new BadRequestException("Question must be a CODING question");
        }
        if (assessment.getStatus() != AssessmentStatus.PUBLISHED) {
            throw new BadRequestException("Assessment must be published before coding submissions are allowed");
        }
        if (assessment.getType() != AssessmentType.CODING && assessment.getType() != AssessmentType.MIXED) {
            throw new BadRequestException("Coding submissions require a CODING or MIXED assessment");
        }
        Instant now = Instant.now();
        if (assessment.getStartAt() != null && now.isBefore(assessment.getStartAt())) {
            throw new BadRequestException("Assessment has not started yet");
        }
        if (assessment.getEndAt() != null && now.isAfter(assessment.getEndAt())) {
            throw new BadRequestException("Assessment has already ended");
        }
        if (!isAssignedToStudent(assessment, student.getId())) {
            throw new UnauthorizedException("Student can submit code only for assigned assessments");
        }
        if (question.getCodingDetails() == null) {
            throw new BadRequestException("Coding question details are missing");
        }
        return question;
    }

    private Submission resolveParentSubmission(CodingRequests.CodingSubmissionRequest request, Assessment assessment, User student) {
        if (request.submissionId() != null) {
            Submission submission = submissionRepository.findById(request.submissionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
            if (!submission.getStudent().getId().equals(student.getId())) {
                throw new UnauthorizedException("Students can link only their own submissions");
            }
            if (!submission.getAssessment().getId().equals(assessment.getId())) {
                throw new BadRequestException("Submission does not belong to this assessment");
            }
            if (submission.getStatus() != SubmissionStatus.STARTED) {
                throw new BadRequestException("Coding submissions can be linked only to STARTED submissions");
            }
            return submission;
        }
        return submissionRepository.findFirstByAssessmentIdAndStudentIdAndStatus(assessment.getId(), student.getId(), SubmissionStatus.STARTED)
                .orElseGet(() -> createStartedSubmission(assessment, student));
    }

    private Submission createStartedSubmission(Assessment assessment, User student) {
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
        return submissionRepository.save(submission);
    }

    private void validateLanguage(Question question, String language) {
        Set<String> allowedLanguages = allowedLanguages(question.getCodingDetails());
        if (!allowedLanguages.isEmpty() && !allowedLanguages.contains(language.trim().toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Unsupported language for this coding question: " + language);
        }
    }

    private Set<String> allowedLanguages(CodingQuestionDetails details) {
        Set<String> allowed = new LinkedHashSet<>();
        if (details.getLanguagesAllowedJson() != null && !details.getLanguagesAllowedJson().isBlank()) {
            String cleaned = details.getLanguagesAllowedJson().replace("[", "").replace("]", "")
                    .replace("\"", "").replace("'", "");
            Arrays.stream(cleaned.split("[,|]"))
                    .map(String::trim)
                    .filter(item -> !item.isBlank())
                    .map(item -> item.toLowerCase(Locale.ROOT))
                    .forEach(allowed::add);
        }
        for (CodingTemplate template : details.getTemplates()) {
            if (template.getLanguage() != null && !template.getLanguage().isBlank()) {
                allowed.add(template.getLanguage().trim().toLowerCase(Locale.ROOT));
            }
        }
        return allowed;
    }

    private boolean isAssignedToStudent(Assessment assessment, UUID studentId) {
        return assessment.getAssignedBatches().stream()
                .anyMatch(link -> link.getBatch().getStudents().stream()
                        .anyMatch(batchStudent -> batchStudent.getStudent().getId().equals(studentId)));
    }

    private boolean canReadCodingSubmission(CodingSubmission submission, User currentUser) {
        if (currentUser.getRole() == Role.STUDENT) {
            return submission.getStudent().getId().equals(currentUser.getId());
        }
        User createdBy = submission.getQuestion().getAssessment().getCreatedBy();
        return createdBy != null && createdBy.getId().equals(currentUser.getId());
    }

    private List<CodingResponses.TestResultResponse> placeholderResults(CodingQuestionDetails details) {
        if (details == null || details.getTestCases().isEmpty()) {
            return List.of(new CodingResponses.TestResultResponse("sample input", "sample output", "sample output", true, "public"));
        }
        return details.getTestCases().stream()
                .map(testCase -> new CodingResponses.TestResultResponse(testCase.getInput(), testCase.getExpectedOutput(),
                        testCase.getExpectedOutput(), true, testCase.getVisibility()))
                .toList();
    }

    private void addPlaceholderTestResults(CodingSubmission submission, CodingQuestionDetails details) {
        if (details == null) {
            return;
        }
        for (CodingTestCase testCase : details.getTestCases()) {
            CodingTestResult result = new CodingTestResult();
            result.setCodingSubmission(submission);
            result.setTestCase(testCase);
            result.setPassed(false);
            result.setActualOutput("PENDING_SECURE_SANDBOX");
            result.setExecutionTime(BigDecimal.ZERO);
            result.setMemoryUsed(BigDecimal.ZERO);
            submission.getTestResults().add(result);
        }
    }
}
