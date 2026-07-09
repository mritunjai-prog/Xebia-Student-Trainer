package com.xebia.portal.controller;

import com.xebia.portal.dto.request.UserRequests;
import com.xebia.portal.dto.response.ApiResponse;
import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse getMe() {
        return ApiResponse.success("Current user fetched", userService.getMe());
    }

    @PutMapping("/me")
    public ApiResponse updateMe(@Valid @RequestBody UserRequests.UpdateProfileRequest request) {
        return ApiResponse.success("Profile updated", userService.updateMe(request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse> updatePassword(@Valid @RequestBody UserRequests.UpdatePasswordRequest request) {
        userService.updatePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password updated"));
    }

    @PutMapping("/me/notification-settings")
    public ResponseEntity<ApiResponse> updateNotificationSettings(@RequestBody UserRequests.NotificationSettingsRequest request) {
        userService.updateNotificationSettings(request);
        return ResponseEntity.ok(ApiResponse.success("Notification settings updated"));
    }

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse getUsers(@RequestParam(required = false) Role role) {
        return ApiResponse.success("Users fetched", userService.getUsers(role));
    }
}
