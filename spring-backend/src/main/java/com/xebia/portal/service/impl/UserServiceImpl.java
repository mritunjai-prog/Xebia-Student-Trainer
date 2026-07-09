package com.xebia.portal.service.impl;

import com.xebia.portal.dto.request.UserRequests;
import com.xebia.portal.dto.response.UserResponse;
import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.entity.UserSettings;
import com.xebia.portal.exception.BadRequestException;
import com.xebia.portal.mapper.PortalMapper;
import com.xebia.portal.repository.UserRepository;
import com.xebia.portal.repository.UserSettingsRepository;
import com.xebia.portal.service.CurrentUserService;
import com.xebia.portal.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final UserSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final PortalMapper mapper;

    public UserServiceImpl(CurrentUserService currentUserService, UserRepository userRepository,
                           UserSettingsRepository settingsRepository, PasswordEncoder passwordEncoder, PortalMapper mapper) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.passwordEncoder = passwordEncoder;
        this.mapper = mapper;
    }

    @Override
    public UserResponse getMe() {
        return mapper.toUserResponse(currentUserService.requireCurrentUser());
    }

    @Override
    public UserResponse updateMe(UserRequests.UpdateProfileRequest request) {
        var user = currentUserService.requireCurrentUser();
        userRepository.findByEmailIgnoreCase(request.email())
                .filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> {
                    throw new BadRequestException("Email already exists");
                });
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setBio(request.bio());
        user.setAvatarUrl(request.avatarUrl());
        return mapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public void updatePassword(UserRequests.UpdatePasswordRequest request) {
        var user = currentUserService.requireCurrentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Override
    public void updateNotificationSettings(UserRequests.NotificationSettingsRequest request) {
        var user = currentUserService.requireCurrentUser();
        var settings = settingsRepository.findById(user.getId()).orElseGet(() -> {
            UserSettings created = new UserSettings();
            created.setUser(user);
            return created;
        });
        if (request.notifyPush() != null) settings.setNotifyPush(request.notifyPush());
        if (request.notifyGraded() != null) settings.setNotifyGraded(request.notifyGraded());
        if (request.notifyDeadline() != null) settings.setNotifyDeadline(request.notifyDeadline());
        if (request.soundEffects() != null) settings.setSoundEffects(request.soundEffects());
        if (request.language() != null) settings.setLanguage(request.language());
        if (request.theme() != null) settings.setTheme(request.theme());
        settingsRepository.save(settings);
    }

    @Override
    public List<UserResponse> getUsers(Role role) {
        var users = role == null ? userRepository.findAll() : userRepository.findByRole(role);
        return users.stream().map(mapper::toUserResponse).toList();
    }
}
