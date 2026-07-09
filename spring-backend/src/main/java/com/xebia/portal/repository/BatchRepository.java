package com.xebia.portal.repository;

import com.xebia.portal.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BatchRepository extends JpaRepository<Batch, UUID> {
    boolean existsByNameIgnoreCase(String name);
    Optional<Batch> findByNameIgnoreCase(String name);
}
