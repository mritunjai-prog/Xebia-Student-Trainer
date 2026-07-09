package com.xebia.portal.repository;

import com.xebia.portal.entity.CodingTestResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CodingTestResultRepository extends JpaRepository<CodingTestResult, UUID> {
}
