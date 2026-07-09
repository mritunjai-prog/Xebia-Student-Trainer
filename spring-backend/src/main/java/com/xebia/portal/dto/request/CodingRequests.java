package com.xebia.portal.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public final class CodingRequests {
    private CodingRequests() {
    }

    public record RunCodeRequest(@NotNull UUID assessmentId, @NotNull UUID questionId, @NotBlank String language,
                                 @NotBlank String code, String customInput) {
    }

    public record CodingSubmissionRequest(UUID submissionId, @NotNull UUID assessmentId, @NotNull UUID questionId,
                                          @NotBlank String language, @NotBlank String code) {
    }
}
