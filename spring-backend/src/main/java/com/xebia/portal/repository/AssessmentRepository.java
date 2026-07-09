package com.xebia.portal.repository;

import com.xebia.portal.entity.Assessment;
import com.xebia.portal.entity.Enums.AssessmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {
    List<Assessment> findByStatus(AssessmentStatus status);
    List<Assessment> findByCreatedById(UUID teacherId);
}
