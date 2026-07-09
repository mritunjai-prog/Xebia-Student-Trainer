package com.xebia.portal.repository;

import com.xebia.portal.entity.SubmissionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SubmissionAnswerRepository extends JpaRepository<SubmissionAnswer, UUID> {
}
