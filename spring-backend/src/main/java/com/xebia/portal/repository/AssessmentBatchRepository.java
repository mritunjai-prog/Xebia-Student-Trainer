package com.xebia.portal.repository;

import com.xebia.portal.entity.AssessmentBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AssessmentBatchRepository extends JpaRepository<AssessmentBatch, UUID> {
    List<AssessmentBatch> findByBatchId(UUID batchId);
    List<AssessmentBatch> findByAssessmentId(UUID assessmentId);
}
