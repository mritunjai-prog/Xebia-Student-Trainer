package com.xebia.portal.repository;

import com.xebia.portal.entity.CodingTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CodingTemplateRepository extends JpaRepository<CodingTemplate, UUID> {
}
