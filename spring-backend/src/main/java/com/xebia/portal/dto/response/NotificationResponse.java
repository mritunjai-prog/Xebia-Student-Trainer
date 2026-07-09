package com.xebia.portal.dto.response;

import com.xebia.portal.entity.Enums.RecipientRole;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(UUID id, String title, String message, String type, UUID recipientUserId,
                                   UUID recipientBatchId, RecipientRole recipientRole, boolean read, Instant createdAt) {
}
