package com.xebia.portal.service.impl;

import com.xebia.portal.dto.request.AssessmentRequests;
import com.xebia.portal.dto.response.AssessmentResponse;
import com.xebia.portal.entity.*;
import com.xebia.portal.entity.Enums.AssessmentStatus;
import com.xebia.portal.entity.Enums.QuestionType;
import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.exception.BadRequestException;
import com.xebia.portal.exception.ResourceNotFoundException;
import com.xebia.portal.exception.UnauthorizedException;
import com.xebia.portal.mapper.PortalMapper;
import com.xebia.portal.repository.AssessmentRepository;
import com.xebia.portal.repository.BatchRepository;
import com.xebia.portal.service.AssessmentService;
import com.xebia.portal.service.CurrentUserService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AssessmentServiceImpl implements AssessmentService {
    private final AssessmentRepository assessmentRepository;
    private final BatchRepository batchRepository;
    private final CurrentUserService currentUserService;
    private final PortalMapper mapper;

    public AssessmentServiceImpl(AssessmentRepository assessmentRepository, BatchRepository batchRepository,
                                 CurrentUserService currentUserService, PortalMapper mapper) {
        this.assessmentRepository = assessmentRepository;
        this.batchRepository = batchRepository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AssessmentResponse> getAssessments() {
        var teacher = currentUserService.requireCurrentUser();
        return assessmentRepository.findByCreatedById(teacher.getId()).stream().map(mapper::toAssessmentResponse).toList();
    }

    @Override
    @Transactional
    public AssessmentResponse createAssessment(AssessmentRequests.AssessmentRequest request) {
        Assessment assessment = new Assessment();
        assessment.setCreatedBy(currentUserService.requireCurrentUser());
        apply(assessment, request);
        if (assessment.getStatus() == AssessmentStatus.PUBLISHED) {
            validatePublishable(assessment);
        }
        return mapper.toAssessmentResponse(assessmentRepository.save(assessment));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public AssessmentResponse getAssessment(UUID id) {
        Assessment assessment = findAssessment(id);
        ensureCanRead(assessment);
        return mapper.toAssessmentResponse(assessment);
    }

    @Override
    @Transactional
    public AssessmentResponse updateAssessment(UUID id, AssessmentRequests.AssessmentRequest request) {
        Assessment assessment = findAssessment(id);
        ensureTeacherOwns(assessment);
        apply(assessment, request);
        if (assessment.getStatus() == AssessmentStatus.PUBLISHED) {
            validatePublishable(assessment);
        }
        return mapper.toAssessmentResponse(assessmentRepository.save(assessment));
    }

    @Override
    @Transactional
    public void deleteAssessment(UUID id) {
        Assessment assessment = findAssessment(id);
        ensureTeacherOwns(assessment);
        assessmentRepository.delete(assessment);
    }

    @Override
    @Transactional
    public AssessmentResponse publish(UUID id) {
        Assessment assessment = findAssessment(id);
        ensureTeacherOwns(assessment);
        validatePublishable(assessment);
        assessment.setStatus(AssessmentStatus.PUBLISHED);
        return mapper.toAssessmentResponse(assessmentRepository.save(assessment));
    }

    @Override
    @Transactional
    public AssessmentResponse duplicate(UUID id) {
        Assessment original = findAssessment(id);
        ensureTeacherOwns(original);
        Assessment copy = new Assessment();
        copy.setCreatedBy(currentUserService.requireCurrentUser());
        copy.setTitle(original.getTitle() + " (Copy)");
        copy.setTopic(original.getTopic());
        copy.setCourse(original.getCourse());
        copy.setSubject(original.getSubject());
        copy.setDescription(original.getDescription());
        copy.setType(original.getType());
        copy.setDifficulty(original.getDifficulty());
        copy.setStatus(AssessmentStatus.DRAFT);
        copy.setDuration(original.getDuration());
        copy.setMarks(original.getMarks());
        copy.setPassingMarks(original.getPassingMarks());
        copy.setMaxAttempts(original.getMaxAttempts());
        copy.setStartAt(original.getStartAt());
        copy.setEndAt(original.getEndAt());
        copy.setNegativeMarking(original.isNegativeMarking());
        copy.setNegativeMarksValue(original.getNegativeMarksValue());
        copy.setShuffleQuestions(original.isShuffleQuestions());
        copy.setAutoSubmit(original.isAutoSubmit());
        for (Question q : original.getQuestions()) {
            Question qc = new Question();
            qc.setAssessment(copy);
            qc.setType(q.getType());
            qc.setQuestionText(q.getQuestionText());
            qc.setMarks(q.getMarks());
            qc.setRequired(q.isRequired());
            qc.setExplanation(q.getExplanation());
            qc.setCorrectAnswer(q.getCorrectAnswer());
            qc.setSortOrder(q.getSortOrder());
            for (QuestionOption option : q.getOptions()) {
                QuestionOption oc = new QuestionOption();
                oc.setQuestion(qc);
                oc.setOptionText(option.getOptionText());
                oc.setCorrect(option.isCorrect());
                oc.setSortOrder(option.getSortOrder());
                qc.getOptions().add(oc);
            }
            if (q.getCodingDetails() != null) {
                qc.setCodingDetails(copyCodingDetails(qc, q.getCodingDetails()));
            }
            copy.getQuestions().add(qc);
        }
        for (AssessmentBatch originalLink : original.getAssignedBatches()) {
            AssessmentBatch copyLink = new AssessmentBatch();
            copyLink.setAssessment(copy);
            copyLink.setBatch(originalLink.getBatch());
            copy.getAssignedBatches().add(copyLink);
        }
        return mapper.toAssessmentResponse(assessmentRepository.save(copy));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<AssessmentResponse> getCurrentStudentAssessments() {
        var student = currentUserService.requireCurrentUser();
        // TODO: tighten this query into a repository method once frontend filters are finalized.
        return assessmentRepository.findByStatus(AssessmentStatus.PUBLISHED).stream()
                .filter(assessment -> assessment.getAssignedBatches().stream()
                        .anyMatch(link -> link.getBatch().getStudents().stream()
                                .anyMatch(bs -> bs.getStudent().getId().equals(student.getId()))))
                .map(mapper::toAssessmentResponse)
                .toList();
    }

    private Assessment findAssessment(UUID id) {
        return assessmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Assessment not found"));
    }

    private void ensureCanRead(Assessment assessment) {
        User currentUser = currentUserService.requireCurrentUser();
        if (currentUser.getRole() == Role.TEACHER) {
            ensureTeacherOwns(assessment, currentUser);
            return;
        }
        if (assessment.getStatus() != AssessmentStatus.PUBLISHED || !isAssignedToStudent(assessment, currentUser.getId())) {
            throw new UnauthorizedException("Student can access only assigned published assessments");
        }
    }

    private void ensureTeacherOwns(Assessment assessment) {
        ensureTeacherOwns(assessment, currentUserService.requireCurrentUser());
    }

    private void ensureTeacherOwns(Assessment assessment, User teacher) {
        if (teacher.getRole() != Role.TEACHER) {
            throw new UnauthorizedException("Teacher access required");
        }
        if (assessment.getCreatedBy() != null && !assessment.getCreatedBy().getId().equals(teacher.getId())) {
            throw new UnauthorizedException("Teachers can manage only their own assessments");
        }
    }

    private boolean isAssignedToStudent(Assessment assessment, UUID studentId) {
        return assessment.getAssignedBatches().stream()
                .anyMatch(link -> link.getBatch().getStudents().stream()
                        .anyMatch(batchStudent -> batchStudent.getStudent().getId().equals(studentId)));
    }

    private void validatePublishable(Assessment assessment) {
        if (assessment.getAssignedBatches().isEmpty()) {
            throw new BadRequestException("Assessment must be assigned to at least one batch before publishing");
        }
        if (assessment.getQuestions().isEmpty()) {
            throw new BadRequestException("Assessment must have at least one question before publishing");
        }
        if (assessment.getDuration() == null || assessment.getDuration() <= 0) {
            throw new BadRequestException("Assessment duration must be greater than zero before publishing");
        }
        if (assessment.getMarks() == null || assessment.getMarks() <= 0) {
            throw new BadRequestException("Assessment marks must be greater than zero before publishing");
        }
        if (assessment.getPassingMarks() != null && assessment.getPassingMarks() > assessment.getMarks()) {
            throw new BadRequestException("Passing marks cannot be greater than total marks");
        }
        if (assessment.getStartAt() != null && assessment.getEndAt() != null && assessment.getEndAt().isBefore(assessment.getStartAt())) {
            throw new BadRequestException("Assessment endAt cannot be before startAt");
        }
        for (Question question : assessment.getQuestions()) {
            validatePublishableQuestion(question);
        }
    }

    private void validatePublishableQuestion(Question question) {
        if (question.getMarks() == null || question.getMarks() <= 0) {
            throw new BadRequestException("Each question must have marks greater than zero before publishing");
        }
        if (question.getType() == QuestionType.MCQ || question.getType() == QuestionType.TRUE_FALSE || question.getType() == QuestionType.MULTIPLE_SELECT) {
            long correctCount = question.getOptions().stream().filter(QuestionOption::isCorrect).count();
            if (question.getOptions().size() < 2) {
                throw new BadRequestException(question.getType() + " questions require at least two options");
            }
            if ((question.getType() == QuestionType.MCQ || question.getType() == QuestionType.TRUE_FALSE) && correctCount != 1) {
                throw new BadRequestException(question.getType() + " questions require exactly one correct option");
            }
            if (question.getType() == QuestionType.MULTIPLE_SELECT && correctCount == 0) {
                throw new BadRequestException("MULTIPLE_SELECT questions require at least one correct option");
            }
        }
        if (question.getType() == QuestionType.CODING) {
            CodingQuestionDetails details = question.getCodingDetails();
            if (details == null) {
                throw new BadRequestException("CODING questions require coding details before publishing");
            }
            if (details.getTemplates().isEmpty()) {
                throw new BadRequestException("CODING questions require at least one coding template before publishing");
            }
            if (details.getTestCases().isEmpty()) {
                throw new BadRequestException("CODING questions require at least one test case before publishing");
            }
        }
    }

    private void apply(Assessment assessment, AssessmentRequests.AssessmentRequest request) {
        validateAssessmentRequest(request);
        assessment.setTitle(request.title().trim());
        assessment.setTopic(trimToNull(request.topic()));
        assessment.setCourse(trimToNull(request.course()));
        assessment.setSubject(trimToNull(request.subject()));
        assessment.setDescription(request.description());
        assessment.setType(request.type());
        if (request.difficulty() != null) assessment.setDifficulty(request.difficulty());
        if (request.status() != null) assessment.setStatus(request.status());
        assessment.setDuration(request.duration());
        assessment.setMarks(request.marks());
        assessment.setPassingMarks(request.passingMarks());
        assessment.setMaxAttempts(request.maxAttempts() == null ? 1 : request.maxAttempts());
        assessment.setStartAt(request.startAt());
        assessment.setEndAt(request.endAt());
        assessment.setNegativeMarking(Boolean.TRUE.equals(request.negativeMarking()));
        assessment.setNegativeMarksValue(request.negativeMarksValue() == null ? BigDecimal.ZERO : request.negativeMarksValue());
        assessment.setShuffleQuestions(Boolean.TRUE.equals(request.shuffleQuestions()));
        assessment.setAutoSubmit(Boolean.TRUE.equals(request.autoSubmit()));

        assessment.getQuestions().clear();
        if (request.questions() != null) {
            for (AssessmentRequests.QuestionRequest qr : request.questions()) {
                validateQuestionRequest(qr);
                Question q = new Question();
                q.setAssessment(assessment);
                q.setType(qr.type());
                q.setQuestionText(qr.questionText().trim());
                q.setMarks(qr.marks() == null ? 1 : qr.marks());
                q.setRequired(qr.required() == null || qr.required());
                q.setExplanation(qr.explanation());
                q.setCorrectAnswer(resolveCorrectAnswer(qr));
                q.setSortOrder(qr.sortOrder() == null ? assessment.getQuestions().size() : qr.sortOrder());
                if (qr.options() != null) {
                    for (AssessmentRequests.QuestionOptionRequest or : qr.options()) {
                        QuestionOption option = new QuestionOption();
                        option.setQuestion(q);
                        option.setOptionText(or.optionText().trim());
                        option.setCorrect(Boolean.TRUE.equals(or.correct()));
                        option.setSortOrder(or.sortOrder() == null ? q.getOptions().size() : or.sortOrder());
                        q.getOptions().add(option);
                    }
                }
                if (qr.codingDetails() != null) {
                    q.setCodingDetails(toCodingDetails(q, qr.codingDetails()));
                }
                assessment.getQuestions().add(q);
            }
        }

        assessment.getAssignedBatches().clear();
        if (request.batchIds() != null) {
            for (UUID batchId : new LinkedHashSet<>(request.batchIds())) {
                Batch batch = batchRepository.findById(batchId).orElseThrow(() -> new ResourceNotFoundException("Batch not found: " + batchId));
                AssessmentBatch link = new AssessmentBatch();
                link.setAssessment(assessment);
                link.setBatch(batch);
                assessment.getAssignedBatches().add(link);
            }
        }
    }

    private void validateAssessmentRequest(AssessmentRequests.AssessmentRequest request) {
        if (request.startAt() != null && request.endAt() != null && request.endAt().isBefore(request.startAt())) {
            throw new BadRequestException("Assessment endAt cannot be before startAt");
        }
        if (request.marks() != null && request.passingMarks() != null && request.passingMarks() > request.marks()) {
            throw new BadRequestException("Passing marks cannot be greater than total marks");
        }
        if (Boolean.FALSE.equals(request.negativeMarking()) && request.negativeMarksValue() != null
                && request.negativeMarksValue().compareTo(BigDecimal.ZERO) > 0) {
            throw new BadRequestException("Negative marks value requires negativeMarking to be true");
        }
    }

    private void validateQuestionRequest(AssessmentRequests.QuestionRequest request) {
        if (request.type() == QuestionType.CODING) {
            validateCodingDetailsRequest(request.codingDetails(), false);
            return;
        }
        if (request.codingDetails() != null) {
            throw new BadRequestException("Coding details are valid only for CODING questions");
        }
        if (request.type() == QuestionType.MCQ || request.type() == QuestionType.TRUE_FALSE || request.type() == QuestionType.MULTIPLE_SELECT) {
            validateOptionQuestion(request);
        }
    }

    private void validateOptionQuestion(AssessmentRequests.QuestionRequest request) {
        List<AssessmentRequests.QuestionOptionRequest> options = request.options();
        if (options == null || options.size() < 2) {
            throw new BadRequestException(request.type() + " questions require at least two options");
        }
        Set<String> optionTexts = new LinkedHashSet<>();
        int correctCount = 0;
        for (AssessmentRequests.QuestionOptionRequest option : options) {
            String normalized = option.optionText().trim().toLowerCase(Locale.ROOT);
            if (!optionTexts.add(normalized)) {
                throw new BadRequestException("Question options must be unique");
            }
            if (Boolean.TRUE.equals(option.correct())) {
                correctCount++;
            }
        }
        if ((request.type() == QuestionType.MCQ || request.type() == QuestionType.TRUE_FALSE) && correctCount != 1) {
            throw new BadRequestException(request.type() + " questions require exactly one correct option");
        }
        if (request.type() == QuestionType.MULTIPLE_SELECT && correctCount == 0) {
            throw new BadRequestException("MULTIPLE_SELECT questions require at least one correct option");
        }
    }

    private void validateCodingDetailsRequest(AssessmentRequests.CodingDetailsRequest request, boolean required) {
        if (request == null) {
            if (required) {
                throw new BadRequestException("CODING questions require coding details before publishing");
            }
            return;
        }
        if (request.templates() != null) {
            Set<String> languages = new LinkedHashSet<>();
            for (AssessmentRequests.CodingTemplateRequest template : request.templates()) {
                String language = template.language().trim().toLowerCase(Locale.ROOT);
                if (!languages.add(language)) {
                    throw new BadRequestException("Coding templates must use unique languages");
                }
            }
        }
    }

    private String resolveCorrectAnswer(AssessmentRequests.QuestionRequest request) {
        if (request.type() == QuestionType.MCQ || request.type() == QuestionType.TRUE_FALSE || request.type() == QuestionType.MULTIPLE_SELECT) {
            return request.options().stream()
                    .filter(option -> Boolean.TRUE.equals(option.correct()))
                    .map(option -> option.optionText().trim())
                    .reduce((left, right) -> left + "|" + right)
                    .orElse(null);
        }
        return request.correctAnswer();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private CodingQuestionDetails toCodingDetails(Question question, AssessmentRequests.CodingDetailsRequest request) {
        CodingQuestionDetails details = new CodingQuestionDetails();
        details.setQuestion(question);
        details.setDifficulty(request.difficulty());
        details.setTimeLimitMs(request.timeLimitMs());
        details.setMemoryLimitMb(request.memoryLimitMb());
        details.setConstraintsText(request.constraintsText());
        details.setInputFormat(request.inputFormat());
        details.setOutputFormat(request.outputFormat());
        details.setSampleInput(request.sampleInput());
        details.setSampleOutput(request.sampleOutput());
        details.setNotes(request.notes());
        details.setHintsJson(request.hintsJson());
        details.setTagsJson(request.tagsJson());
        details.setLanguagesAllowedJson(request.languagesAllowedJson());

        if (request.templates() != null) {
            for (AssessmentRequests.CodingTemplateRequest templateRequest : request.templates()) {
                CodingTemplate template = new CodingTemplate();
                template.setQuestion(details);
                template.setLanguage(templateRequest.language());
                template.setStarterCode(templateRequest.starterCode());
                details.getTemplates().add(template);
            }
        }
        if (request.testCases() != null) {
            for (AssessmentRequests.CodingTestCaseRequest testCaseRequest : request.testCases()) {
                CodingTestCase testCase = new CodingTestCase();
                testCase.setQuestion(details);
                testCase.setInput(testCaseRequest.input());
                testCase.setExpectedOutput(testCaseRequest.expectedOutput());
                testCase.setWeight(testCaseRequest.weight() == null ? 1 : testCaseRequest.weight());
                testCase.setVisibility(testCaseRequest.visibility() == null ? "public" : testCaseRequest.visibility());
                details.getTestCases().add(testCase);
            }
        }
        return details;
    }

    private CodingQuestionDetails copyCodingDetails(Question question, CodingQuestionDetails source) {
        CodingQuestionDetails details = new CodingQuestionDetails();
        details.setQuestion(question);
        details.setDifficulty(source.getDifficulty());
        details.setTimeLimitMs(source.getTimeLimitMs());
        details.setMemoryLimitMb(source.getMemoryLimitMb());
        details.setConstraintsText(source.getConstraintsText());
        details.setInputFormat(source.getInputFormat());
        details.setOutputFormat(source.getOutputFormat());
        details.setSampleInput(source.getSampleInput());
        details.setSampleOutput(source.getSampleOutput());
        details.setNotes(source.getNotes());
        details.setHintsJson(source.getHintsJson());
        details.setTagsJson(source.getTagsJson());
        details.setLanguagesAllowedJson(source.getLanguagesAllowedJson());
        for (CodingTemplate sourceTemplate : source.getTemplates()) {
            CodingTemplate template = new CodingTemplate();
            template.setQuestion(details);
            template.setLanguage(sourceTemplate.getLanguage());
            template.setStarterCode(sourceTemplate.getStarterCode());
            details.getTemplates().add(template);
        }
        for (CodingTestCase sourceTestCase : source.getTestCases()) {
            CodingTestCase testCase = new CodingTestCase();
            testCase.setQuestion(details);
            testCase.setInput(sourceTestCase.getInput());
            testCase.setExpectedOutput(sourceTestCase.getExpectedOutput());
            testCase.setWeight(sourceTestCase.getWeight());
            testCase.setVisibility(sourceTestCase.getVisibility());
            details.getTestCases().add(testCase);
        }
        return details;
    }
}
