package com.xebia.portal.dto.response;

import java.time.Instant;
import java.util.UUID;

public record FileUploadResponse(UUID id, String fileName, String contentType, Long sizeBytes,
                                 String storageUrl, Instant createdAt) {
}
