package com.xebia.portal.mapper;

import com.xebia.portal.dto.response.*;
import com.xebia.portal.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PortalMapper {

    public UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getDepartment(),
                user.getAvatarUrl(), user.getPhone(), user.getBio(), user.isActive(), user.getCreatedAt(), user.getUpdatedAt());
    }

    public BatchResponse toBatchResponse(Batch batch) {
        List<java.util.UUID> studentIds = batch.getStudents().stream().map(item -> item.getStudent().getId()).toList();
        return new BatchResponse(batch.getId(), batch.getName(), batch.getCourse(), batch.getIcon(), batch.getStatus(),
                batch.getCreatedBy() == null ? null : batch.getCreatedBy().getId(), batch.getCreatedAt(), studentIds.size(), studentIds);
    }

    public AssessmentResponse toAssessmentResponse(Assessment assessment) {
        List<java.util.UUID> batchIds = assessment.getAssignedBatches().stream().map(item -> item.getBatch().getId()).toList();
        List<AssessmentResponse.QuestionResponse> questions = assessment.getQuestions().stream()
                .map(this::toQuestionResponse)
                .toList();
        return new AssessmentResponse(assessment.getId(), assessment.getTitle(), assessment.getTopic(), assessment.getCourse(),
                assessment.getSubject(), assessment.getDescription(), assessment.getType(), assessment.getDifficulty(),
                assessment.getStatus(), assessment.getDuration(), assessment.getMarks(), assessment.getPassingMarks(),
                assessment.getMaxAttempts(), assessment.getStartAt(), assessment.getEndAt(), assessment.isNegativeMarking(),
                assessment.getNegativeMarksValue(), assessment.isShuffleQuestions(), assessment.isAutoSubmit(),
                assessment.getCreatedBy() == null ? null : assessment.getCreatedBy().getId(), assessment.getCreatedAt(),
                assessment.getUpdatedAt(), batchIds, questions);
    }

    public AssessmentResponse.QuestionResponse toQuestionResponse(Question question) {
        List<AssessmentResponse.OptionResponse> options = question.getOptions().stream()
                .map(option -> new AssessmentResponse.OptionResponse(option.getId(), option.getOptionText(), option.isCorrect(), option.getSortOrder()))
                .toList();
        return new AssessmentResponse.QuestionResponse(question.getId(), question.getType(), question.getQuestionText(),
                question.getMarks(), question.isRequired(), question.getExplanation(), question.getCorrectAnswer(),
                question.getSortOrder(), options, toCodingDetailsResponse(question.getCodingDetails()));
    }

    private AssessmentResponse.CodingDetailsResponse toCodingDetailsResponse(CodingQuestionDetails details) {
        if (details == null) {
            return null;
        }
        List<AssessmentResponse.CodingTemplateResponse> templates = details.getTemplates().stream()
                .map(template -> new AssessmentResponse.CodingTemplateResponse(
                        template.getId(), template.getLanguage(), template.getStarterCode()))
                .toList();
        List<AssessmentResponse.CodingTestCaseResponse> testCases = details.getTestCases().stream()
                .map(testCase -> new AssessmentResponse.CodingTestCaseResponse(
                        testCase.getId(), testCase.getInput(), testCase.getExpectedOutput(),
                        testCase.getWeight(), testCase.getVisibility()))
                .toList();
        return new AssessmentResponse.CodingDetailsResponse(details.getDifficulty(), details.getTimeLimitMs(),
                details.getMemoryLimitMb(), details.getConstraintsText(), details.getInputFormat(),
                details.getOutputFormat(), details.getSampleInput(), details.getSampleOutput(), details.getNotes(),
                details.getHintsJson(), details.getTagsJson(), details.getLanguagesAllowedJson(), templates, testCases);
    }

    public SubmissionResponse toSubmissionResponse(Submission submission) {
        List<SubmissionResponse.AnswerResponse> answers = submission.getAnswers().stream()
                .map(answer -> new SubmissionResponse.AnswerResponse(answer.getId(), answer.getQuestion().getId(),
                        answer.getAnswerText(), answer.getAnswerJson(), answer.getMarksAwarded(), answer.getRemarks(),
                        answer.isReviewed(), answer.isCorrect()))
                .toList();
        return new SubmissionResponse(submission.getId(), submission.getAssessment().getId(), submission.getStudent().getId(),
                submission.getStatus(), submission.getStartedAt(), submission.getSubmittedAt(), submission.getScore(),
                submission.getPercentage(), submission.getTimeTaken(), submission.isEvaluated(), submission.getRemarks(),
                submission.getEvaluatedBy() == null ? null : submission.getEvaluatedBy().getId(), submission.getEvaluatedAt(), answers);
    }

    public SubmissionResultResponse toSubmissionResultResponse(Submission submission, boolean includeCorrectDetails) {
        Assessment assessment = submission.getAssessment();
        User student = submission.getStudent();
        List<SubmissionResultResponse.AnswerResultResponse> answers = submission.getAnswers().stream()
                .map(answer -> toAnswerResultResponse(answer, includeCorrectDetails))
                .toList();
        return new SubmissionResultResponse(submission.getId(),
                new SubmissionResultResponse.AssessmentSummary(assessment.getId(), assessment.getTitle(), assessment.getType(), assessment.getStatus()),
                new SubmissionResultResponse.StudentSummary(student.getId(), student.getName(), student.getEmail()),
                submission.getStatus(), submission.getScore(), submission.getPercentage(), submission.getStartedAt(),
                submission.getSubmittedAt(), submission.getEvaluatedAt(), submission.getRemarks(), answers);
    }

    private SubmissionResultResponse.AnswerResultResponse toAnswerResultResponse(SubmissionAnswer answer, boolean includeCorrectDetails) {
        Question question = answer.getQuestion();
        List<SubmissionResultResponse.OptionResultResponse> options = includeCorrectDetails
                ? question.getOptions().stream()
                .map(option -> new SubmissionResultResponse.OptionResultResponse(option.getId(), option.getOptionText(), option.isCorrect()))
                .toList()
                : List.of();
        return new SubmissionResultResponse.AnswerResultResponse(answer.getId(), question.getId(), question.getType(),
                question.getQuestionText(), answer.getAnswerText(), answer.getAnswerJson(),
                includeCorrectDetails ? question.getCorrectAnswer() : null, options, answer.getMarksAwarded(),
                question.getMarks(), answer.getRemarks(), answer.isCorrect(), answer.isReviewed());
    }

    public CodingResponses.CodingSubmissionResponse toCodingSubmissionResponse(CodingSubmission submission) {
        return new CodingResponses.CodingSubmissionResponse(submission.getId(),
                submission.getSubmission() == null ? null : submission.getSubmission().getId(),
                submission.getQuestion().getAssessment().getId(), submission.getQuestion().getId(), submission.getStudent().getId(),
                submission.getLanguage(), submission.getScore(), submission.getStatus(), submission.getTimeTaken(),
                submission.getMemoryUsed(), submission.getSubmittedAt());
    }

    public NotificationResponse toNotificationResponse(Notification notification) {
        return new NotificationResponse(notification.getId(), notification.getTitle(), notification.getMessage(),
                notification.getType(), notification.getRecipientUser() == null ? null : notification.getRecipientUser().getId(),
                notification.getRecipientBatch() == null ? null : notification.getRecipientBatch().getId(),
                notification.getRecipientRole(), notification.isRead(), notification.getCreatedAt());
    }

    public FileUploadResponse toFileUploadResponse(FileUpload fileUpload) {
        return new FileUploadResponse(fileUpload.getId(), fileUpload.getFileName(), fileUpload.getContentType(),
                fileUpload.getSizeBytes(), fileUpload.getStorageUrl(), fileUpload.getCreatedAt());
    }
}
