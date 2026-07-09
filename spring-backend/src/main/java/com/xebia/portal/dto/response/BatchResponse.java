package com.xebia.portal.dto.response;

import com.xebia.portal.entity.Enums.BatchStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BatchResponse(
        UUID id,
        String name,
        String course,
        String icon,
        BatchStatus status,
        UUID createdBy,
        Instant createdAt,
        int studentCount,
        List<UUID> studentIds
) {
}
