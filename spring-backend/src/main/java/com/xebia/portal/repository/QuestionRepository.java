package com.xebia.portal.repository;

import com.xebia.portal.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findByAssessmentIdOrderBySortOrderAsc(UUID assessmentId);
}
