package com.xebia.portal.dto.response;

import java.time.Instant;
import java.util.UUID;

public record DraftResponse(
        UUID id,
        UUID assessmentId,
        UUID studentId,
        Object draftData,
        Instant updatedAt
) {
}
