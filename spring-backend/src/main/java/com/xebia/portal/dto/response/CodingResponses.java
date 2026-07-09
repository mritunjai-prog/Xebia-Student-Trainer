package com.xebia.portal.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class CodingResponses {
    private CodingResponses() {
    }

    public record RunCodeResponse(String status, boolean passed, String output, BigDecimal executionTime,
                                  BigDecimal memoryUsed, List<TestResultResponse> testCaseResults, String message) {
    }

    public record CodingSubmissionResponse(UUID id, UUID submissionId, UUID assessmentId, UUID questionId,
                                           UUID studentId, String language, BigDecimal score, String status,
                                           Integer timeTaken, BigDecimal memoryUsed, Instant submittedAt) {
    }

    public record TestResultResponse(String input, String expected, String actual, boolean passed, String visibility) {
    }
}
