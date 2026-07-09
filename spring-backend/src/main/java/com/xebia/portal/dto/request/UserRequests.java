package com.xebia.portal.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class UserRequests {
    private UserRequests() {
    }

    public record UpdateProfileRequest(
            @NotBlank String name,
            @Email @NotBlank String email,
            String phone,
            String bio,
            String avatarUrl
    ) {
    }

    public record UpdatePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank String newPassword
    ) {
    }

    public record NotificationSettingsRequest(
            Boolean notifyPush,
            Boolean notifyGraded,
            Boolean notifyDeadline,
            Boolean soundEffects,
            String language,
            String theme
    ) {
    }
}
