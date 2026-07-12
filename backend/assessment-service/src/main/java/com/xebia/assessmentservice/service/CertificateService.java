package com.xebia.assessmentservice.service;

import com.xebia.assessmentservice.model.Assessment;
import com.xebia.assessmentservice.model.Certificate;
import com.xebia.assessmentservice.model.Submission;
import com.xebia.assessmentservice.repository.CertificateRepository;
import com.xebia.assessmentservice.repository.AssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Map;

@Service
public class CertificateService {

    @Autowired
    private CertificateRepository certificateRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private UserClient userClient;

    public List<Certificate> getCertificatesByUserId(String userId) {
        return certificateRepository.findByUserId(userId).stream()
                .filter(c -> c.getRevoked() == null || !c.getRevoked())
                .toList();
    }

    public List<Certificate> getAllCertificates() {
        return certificateRepository.findAll();
    }

    @Transactional
    public Certificate revokeCertificate(String uuid, String revokedBy, String reason) {
        Optional<Certificate> opt = certificateRepository.findByCertificateUuid(uuid);
        if (opt.isPresent()) {
            Certificate cert = opt.get();
            cert.setRevoked(true);
            cert.setRevokedBy(revokedBy);
            cert.setRevocationReason(reason);
            cert.setRevokedAt(LocalDateTime.now());
            return certificateRepository.save(cert);
        }
        return null;
    }

    public Optional<Certificate> getCertificateByUuid(String uuid) {
        return certificateRepository.findByCertificateUuid(uuid);
    }

    @Transactional
    public Certificate generateCertificate(Submission submission, Assessment assessment) {
        if (certificateRepository.existsBySubmissionId(submission.getId())) {
            return certificateRepository.findBySubmissionId(submission.getId()).get();
        }

        Integer passingLimit = assessment.getPassingMarks() != null ? assessment.getPassingMarks() : 60;
        if (submission.getPercentage() == null || submission.getPercentage() < passingLimit) {
            return null; // Doesn't meet passing criteria
        }

        Certificate certificate = new Certificate();
        certificate.setCertificateUuid(UUID.randomUUID().toString());
        certificate.setUserId(submission.getStudentId());
        certificate.setAssessmentId(assessment.getId());
        certificate.setSubmissionId(submission.getId());
        certificate.setIssuedAt(LocalDateTime.now());
        certificate.setFinalScore(submission.getPercentage().doubleValue());

        // Serial ID = XEB - [Assessment Short Code] - [YYYY-MM-DD] - [Submission Hash Last 4]
        String title = assessment.getTitle() != null ? assessment.getTitle().trim() : "AST";
        String shortCode = title.length() >= 3 ? title.substring(0, 3).toUpperCase() : title.toUpperCase();
        if (shortCode.isEmpty()) {
            shortCode = "AST";
        }
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String hash = String.format("%04x", submission.getId().hashCode() & 0xFFFF);
        
        String serialNumber = String.format("XEB-%s-%s-%s", shortCode, dateStr, hash);
        certificate.setSerialNumber(serialNumber);

        return certificateRepository.save(certificate);
    }
    
    public Map<String, Object> getCertificateDetails(String uuid) {
        Optional<Certificate> certOpt = certificateRepository.findByCertificateUuid(uuid);
        if (certOpt.isEmpty()) return null;
        
        Certificate cert = certOpt.get();
        Map<String, Object> user = userClient.getUserById(cert.getUserId());
        
        String studentName = "Student";
        if (user != null && user.containsKey("name")) {
            studentName = (String) user.get("name");
        }

        String assessmentTitle = "Assessment";
        Assessment assessment = null;
        Optional<Assessment> assessOpt = assessmentRepository.findById(cert.getAssessmentId());
        if (assessOpt.isPresent()) {
            assessment = assessOpt.get();
            assessmentTitle = assessment.getTitle();
        }
        
        java.util.Map<String, Object> details = new java.util.HashMap<>();
        details.put("certificate", cert);
        details.put("studentName", studentName);
        details.put("assessmentTitle", assessmentTitle);
        if (assessment != null) {
            details.put("assessment", assessment);
        }
        return details;
    }
}
