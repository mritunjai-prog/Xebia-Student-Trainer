package com.xebia.portal.service;

import com.xebia.portal.dto.response.NotificationResponse;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    List<NotificationResponse> getNotifications();
    NotificationResponse markRead(UUID id);
    void markAllRead();
}
