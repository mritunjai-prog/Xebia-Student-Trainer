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
}
