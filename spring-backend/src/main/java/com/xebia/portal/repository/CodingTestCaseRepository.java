package com.xebia.portal.repository;

import com.xebia.portal.entity.CodingTestCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CodingTestCaseRepository extends JpaRepository<CodingTestCase, UUID> {
}
