package com.xebia.portal.service.impl;

import com.xebia.portal.dto.request.AuthRequests;
import com.xebia.portal.dto.response.AuthResponses;
import com.xebia.portal.exception.UnauthorizedException;
import com.xebia.portal.mapper.PortalMapper;
import com.xebia.portal.repository.UserRepository;
import com.xebia.portal.security.JwtTokenProvider;
import com.xebia.portal.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final PortalMapper mapper;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider, PortalMapper mapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.mapper = mapper;
    }

    @Override
    public AuthResponses.AuthResponse login(AuthRequests.LoginRequest request) {
        var user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!user.isActive() || user.getRole() != request.role() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        return new AuthResponses.AuthResponse(tokenProvider.createAccessToken(user), tokenProvider.createRefreshToken(user), mapper.toUserResponse(user));
    }

    @Override
    public AuthResponses.TokenResponse refresh(AuthRequests.RefreshTokenRequest request) {
        JwtTokenProvider.TokenClaims claims;
        try {
            claims = tokenProvider.parse(request.refreshToken());
        } catch (RuntimeException ex) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        if (!"refresh".equals(claims.type())) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        var user = userRepository.findById(claims.userId()).orElseThrow(() -> new UnauthorizedException("User not found"));
        if (!user.isActive()) {
            throw new UnauthorizedException("User is inactive");
        }
        return new AuthResponses.TokenResponse(tokenProvider.createAccessToken(user));
    }

    @Override
    public void logout() {
        // TODO: Persist token revocation/blacklist if refresh tokens are stored server-side later.
    }
}
