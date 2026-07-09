package com.xebia.portal.service;

import com.xebia.portal.dto.request.AuthRequests;
import com.xebia.portal.dto.response.AuthResponses;

public interface AuthService {
    AuthResponses.AuthResponse login(AuthRequests.LoginRequest request);
    AuthResponses.TokenResponse refresh(AuthRequests.RefreshTokenRequest request);
    void logout();
}
