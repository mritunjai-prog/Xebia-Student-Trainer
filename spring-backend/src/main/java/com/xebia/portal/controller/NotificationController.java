package com.xebia.portal.controller;

import com.xebia.portal.dto.response.ApiResponse;
import com.xebia.portal.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse getNotifications() {
        return ApiResponse.success("Notifications fetched", notificationService.getNotifications());
    }

    @PutMapping("/{id}/read")
    public ApiResponse markRead(@PathVariable UUID id) {
        return ApiResponse.success("Notification marked as read", notificationService.markRead(id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllRead() {
        notificationService.markAllRead();
        return ResponseEntity.ok(ApiResponse.success("Notifications marked as read"));
    }
}
