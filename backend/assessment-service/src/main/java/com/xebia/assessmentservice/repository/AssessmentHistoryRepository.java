package com.xebia.assessmentservice.repository;

import com.xebia.assessmentservice.model.AssessmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentHistoryRepository extends JpaRepository<AssessmentHistory, Long> {
    List<AssessmentHistory> findByAssessmentIdOrderByVersionDesc(String assessmentId);
    
    // Helper to find the max version number
    List<AssessmentHistory> findByAssessmentId(String assessmentId);
}
