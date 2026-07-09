package com.xebia.portal.dto.request;

import com.xebia.portal.entity.Enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class AuthRequests {
    private AuthRequests() {
    }

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password, @NotNull Role role) {
    }

    public record RefreshTokenRequest(@NotBlank String refreshToken) {
    }
}
