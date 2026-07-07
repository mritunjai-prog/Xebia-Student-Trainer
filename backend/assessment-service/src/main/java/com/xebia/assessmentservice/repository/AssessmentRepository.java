package com.xebia.assessmentservice.repository;

import com.xebia.assessmentservice.model.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentRepository extends JpaRepository<Assessment, String> {
}
