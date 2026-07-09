package com.xebia.portal.service.impl;

import com.xebia.portal.dto.response.NotificationResponse;
import com.xebia.portal.entity.Batch;
import com.xebia.portal.entity.Notification;
import com.xebia.portal.entity.User;
import com.xebia.portal.entity.Enums.RecipientRole;
import com.xebia.portal.entity.Enums.Role;
import com.xebia.portal.exception.ResourceNotFoundException;
import com.xebia.portal.exception.UnauthorizedException;
import com.xebia.portal.mapper.PortalMapper;
import com.xebia.portal.repository.NotificationRepository;
import com.xebia.portal.service.CurrentUserService;
import com.xebia.portal.service.NotificationService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;
    private final PortalMapper mapper;

    public NotificationServiceImpl(NotificationRepository notificationRepository, CurrentUserService currentUserService, PortalMapper mapper) {
        this.notificationRepository = notificationRepository;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications() {
        var user = currentUserService.requireCurrentUser();
        return notificationRepository.findAll().stream()
                .filter(notification -> isVisibleTo(notification, user))
                .sorted(java.util.Comparator.comparing(Notification::getCreatedAt, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())).reversed())
                .map(mapper::toNotificationResponse)
                .toList();
    }

    @Override
    @Transactional
    public NotificationResponse markRead(UUID id) {
        var user = currentUserService.requireCurrentUser();
        Notification notification = notificationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!isVisibleTo(notification, user)) {
            throw new UnauthorizedException("Cannot update a notification that is not visible to the current user");
        }
        notification.setRead(true);
        return mapper.toNotificationResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllRead() {
        User user = currentUserService.requireCurrentUser();
        notificationRepository.findAll().stream()
                .filter(notification -> isVisibleTo(notification, user))
                .forEach(notification -> notification.setRead(true));
    }

    private boolean isVisibleTo(Notification notification, User user) {
        if (notification.getRecipientUser() != null) {
            return notification.getRecipientUser().getId().equals(user.getId());
        }
        if (notification.getRecipientBatch() != null && !isBatchVisible(notification.getRecipientBatch(), user)) {
            return false;
        }
        RecipientRole recipientRole = notification.getRecipientRole();
        if (recipientRole == null || recipientRole == RecipientRole.ALL) {
            return notification.getRecipientBatch() != null || notification.getRecipientUser() == null;
        }
        return (recipientRole == RecipientRole.STUDENT && user.getRole() == Role.STUDENT)
                || (recipientRole == RecipientRole.TEACHER && user.getRole() == Role.TEACHER);
    }

    private boolean isBatchVisible(Batch batch, User user) {
        if (user.getRole() == Role.TEACHER) {
            return batch.getCreatedBy() != null && batch.getCreatedBy().getId().equals(user.getId());
        }
        return batch.getStudents().stream().anyMatch(link -> link.getStudent().getId().equals(user.getId()));
    }
}
