package com.xebia.portal.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class SubmissionRequests {
    private SubmissionRequests() {
    }

    public record StartSubmissionRequest(@NotNull UUID assessmentId) {
    }

    public record SubmitSubmissionRequest(List<@Valid AnswerRequest> answers, @PositiveOrZero Integer timeTaken) {
    }

    public record AnswerRequest(@NotNull UUID questionId, String answerText, String answerJson) {
    }

    public record EvaluationRequest(@NotEmpty List<@Valid QuestionEvaluationRequest> questionEvaluations, String overallRemarks) {
    }

    public record QuestionEvaluationRequest(@NotNull UUID questionId, @NotNull @PositiveOrZero BigDecimal marksAwarded, String remarks) {
    }
}
