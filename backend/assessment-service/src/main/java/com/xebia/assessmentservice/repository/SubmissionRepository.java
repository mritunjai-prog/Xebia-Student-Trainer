package com.xebia.assessmentservice.repository;

import com.xebia.assessmentservice.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, String> {
    List<Submission> findByAssessmentId(String assessmentId);
    List<Submission> findByStudentId(String studentId);
}
