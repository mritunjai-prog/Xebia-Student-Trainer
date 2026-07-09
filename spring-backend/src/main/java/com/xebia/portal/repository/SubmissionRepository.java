package com.xebia.portal.repository;

import com.xebia.portal.entity.Enums.SubmissionStatus;
import com.xebia.portal.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    List<Submission> findByStudentId(UUID studentId);
    List<Submission> findByAssessmentCreatedById(UUID teacherId);
    List<Submission> findByStudentIdAndAssessmentCreatedById(UUID studentId, UUID teacherId);
    List<Submission> findByStatus(SubmissionStatus status);
    Optional<Submission> findFirstByAssessmentIdAndStudentIdAndStatus(UUID assessmentId, UUID studentId, SubmissionStatus status);
    long countByAssessmentIdAndStudentId(UUID assessmentId, UUID studentId);
}
