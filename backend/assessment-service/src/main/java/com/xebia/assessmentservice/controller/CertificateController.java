package com.xebia.assessmentservice.controller;

import com.xebia.assessmentservice.model.Certificate;
import com.xebia.assessmentservice.service.CertificateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/certificates")
@CrossOrigin(origins = "*")
public class CertificateController {

    @Autowired
    private CertificateService certificateService;

    @GetMapping("/user/{userId}")
    public List<Certificate> getCertificatesByUser(@PathVariable String userId) {
        return certificateService.getCertificatesByUserId(userId);
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<Map<String, Object>> getCertificate(@PathVariable String uuid) {
        Map<String, Object> details = certificateService.getCertificateDetails(uuid);
        if (details == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(details);
    }
}
