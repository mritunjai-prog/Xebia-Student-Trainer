package com.xebia.portal.repository;

import com.xebia.portal.entity.AssessmentDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AssessmentDraftRepository extends JpaRepository<AssessmentDraft, UUID> {
    Optional<AssessmentDraft> findByAssessmentIdAndStudentId(UUID assessmentId, UUID studentId);
}
