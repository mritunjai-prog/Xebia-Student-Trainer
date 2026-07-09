package com.xebia.portal.dto.response;

import com.xebia.portal.entity.Enums.Role;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        Role role,
        String department,
        String avatarUrl,
        String phone,
        String bio,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
