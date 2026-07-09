package com.xebia.portal.service;

import com.xebia.portal.dto.request.UserRequests;
import com.xebia.portal.dto.response.UserResponse;
import com.xebia.portal.entity.Enums.Role;

import java.util.List;

public interface UserService {
    UserResponse getMe();
    UserResponse updateMe(UserRequests.UpdateProfileRequest request);
    void updatePassword(UserRequests.UpdatePasswordRequest request);
    void updateNotificationSettings(UserRequests.NotificationSettingsRequest request);
    List<UserResponse> getUsers(Role role);
}
