package com.xebia.portal.dto.request;

import com.xebia.portal.entity.Enums.BatchStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public final class BatchRequests {
    private BatchRequests() {
    }

    public record BatchRequest(@NotBlank String name, @NotBlank String course, String icon, BatchStatus status, List<@NotNull UUID> studentIds) {
    }

    public record BatchStudentsRequest(List<@NotNull UUID> studentIds) {
    }
}
