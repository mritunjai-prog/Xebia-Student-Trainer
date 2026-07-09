package com.xebia.portal.service.impl;

import com.xebia.portal.entity.User;
import com.xebia.portal.exception.UnauthorizedException;
import com.xebia.portal.repository.UserRepository;
import com.xebia.portal.service.CurrentUserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CurrentUserServiceImpl implements CurrentUserService {
    private final UserRepository userRepository;

    public CurrentUserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException("Authentication required");
        }
        UUID userId = UUID.fromString(authentication.getPrincipal().toString());
        return userRepository.findById(userId).orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
    }
}
