package com.xebia.portal.repository;

import com.xebia.portal.entity.CodingSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CodingSubmissionRepository extends JpaRepository<CodingSubmission, UUID> {
    List<CodingSubmission> findByStudentId(UUID studentId);
    List<CodingSubmission> findByQuestionId(UUID questionId);
    List<CodingSubmission> findByStudentIdAndQuestionId(UUID studentId, UUID questionId);
}
