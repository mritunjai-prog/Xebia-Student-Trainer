package com.xebia.portal.dto.response;

public final class AuthResponses {
    private AuthResponses() {
    }

    public record AuthResponse(String accessToken, String refreshToken, UserResponse user) {
    }

    public record TokenResponse(String accessToken) {
    }
}
