package com.xebia.portal.dto.response;

import com.xebia.portal.entity.Enums.AssessmentStatus;
import com.xebia.portal.entity.Enums.AssessmentType;
import com.xebia.portal.entity.Enums.QuestionType;
import com.xebia.portal.entity.Enums.SubmissionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SubmissionResultResponse(
        UUID id,
        AssessmentSummary assessment,
        StudentSummary student,
        SubmissionStatus status,
        BigDecimal score,
        BigDecimal percentage,
        Instant startedAt,
        Instant submittedAt,
        Instant evaluatedAt,
        String remarks,
        List<AnswerResultResponse> answers
) {
    public record AssessmentSummary(UUID id, String title, AssessmentType type, AssessmentStatus status) {
    }

    public record StudentSummary(UUID id, String name, String email) {
    }

    public record AnswerResultResponse(
            UUID id,
            UUID questionId,
            QuestionType questionType,
            String questionText,
            String answerText,
            String answerJson,
            String correctAnswer,
            List<OptionResultResponse> options,
            BigDecimal marksAwarded,
            Integer maxMarks,
            String remarks,
            boolean correct,
            boolean reviewed
    ) {
    }

    public record OptionResultResponse(UUID id, String optionText, boolean correct) {
    }
}
