package com.xebia.portal.repository;

import com.xebia.portal.entity.BatchStudent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BatchStudentRepository extends JpaRepository<BatchStudent, UUID> {
    List<BatchStudent> findByBatchId(UUID batchId);
    List<BatchStudent> findByStudentId(UUID studentId);
    void deleteByBatchId(UUID batchId);
}
