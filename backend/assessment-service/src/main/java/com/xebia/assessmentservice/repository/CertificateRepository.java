package com.xebia.assessmentservice.repository;

import com.xebia.assessmentservice.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, String> {
    List<Certificate> findByUserId(String userId);
    boolean existsBySubmissionId(String submissionId);
}
