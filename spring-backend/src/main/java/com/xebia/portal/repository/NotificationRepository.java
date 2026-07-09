package com.xebia.portal.repository;

import com.xebia.portal.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientUserIdOrRecipientUserIdIsNullOrderByCreatedAtDesc(UUID userId);
}
