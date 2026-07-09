package com.xebia.assessmentservice.controller;

import com.xebia.assessmentservice.model.Certificate;
import com.xebia.assessmentservice.repository.CertificateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/certificates")
@CrossOrigin(origins = "*")
public class CertificateController {

    @Autowired
    private CertificateRepository certificateRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Certificate>> getUserCertificates(@PathVariable String userId) {
        List<Certificate> certificates = certificateRepository.findByUserId(userId);
        return ResponseEntity.ok(certificates);
    }
    
    @GetMapping
    public ResponseEntity<List<Certificate>> getAllCertificates() {
        return ResponseEntity.ok(certificateRepository.findAll());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateCertificateStatus(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> payload,
            @RequestHeader(value = "X-User-Role", defaultValue = "student") String userRole,
            @RequestHeader(value = "X-User-Id", defaultValue = "unknown") String userId) {
        
        // RBAC Strict Check
        if (!"trainer".equalsIgnoreCase(userRole) && !"admin".equalsIgnoreCase(userRole)) {
            return ResponseEntity.status(403).body("Forbidden: Only trainers or admins can modify certificate states.");
        }

        java.util.Optional<Certificate> opt = certificateRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Certificate cert = opt.get();
        
        String newStatusStr = payload.get("status");
        if (newStatusStr != null) {
            try {
                com.xebia.assessmentservice.model.CertificateStatus newStatus = 
                    com.xebia.assessmentservice.model.CertificateStatus.valueOf(newStatusStr.toUpperCase());
                cert.setStatus(newStatus);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Invalid certificate status");
            }
        }
        
        cert.setLastModifiedBy(userId);
        cert.setModificationReason(payload.get("reason"));
        
        return ResponseEntity.ok(certificateRepository.save(cert));
    }
}
