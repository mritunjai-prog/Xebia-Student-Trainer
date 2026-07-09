package com.xebia.portal.repository;

import com.xebia.portal.entity.CodingQuestionDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CodingQuestionDetailsRepository extends JpaRepository<CodingQuestionDetails, UUID> {
}
