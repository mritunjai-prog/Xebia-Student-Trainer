package com.xebia.portal.dto.response;

import com.xebia.portal.entity.Enums.SubmissionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SubmissionResponse(
        UUID id,
        UUID assessmentId,
        UUID studentId,
        SubmissionStatus status,
        Instant startedAt,
        Instant submittedAt,
        BigDecimal score,
        BigDecimal percentage,
        Integer timeTaken,
        boolean evaluated,
        String remarks,
        UUID evaluatedBy,
        Instant evaluatedAt,
        List<AnswerResponse> answers
) {
    public record AnswerResponse(UUID id, UUID questionId, String answerText, String answerJson,
                                 BigDecimal marksAwarded, String remarks, boolean reviewed, boolean correct) {
    }
}
