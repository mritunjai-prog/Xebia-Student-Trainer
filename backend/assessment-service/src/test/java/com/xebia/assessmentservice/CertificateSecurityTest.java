package com.xebia.assessmentservice;

import com.xebia.assessmentservice.controller.CertificateController;
import com.xebia.assessmentservice.service.CertificateService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class CertificateSecurityTest {

    @Test
    public void testUnauthorizedAccessToCertificateBlocked() {
        CertificateService certificateService = Mockito.mock(CertificateService.class);
        CertificateController certificateController = new CertificateController();
        
        ReflectionTestUtils.setField(certificateController, "certificateService", certificateService);

        String arbitraryUuid = "arbitrary-invalid-uuid";
        Mockito.when(certificateService.getCertificateDetails(arbitraryUuid)).thenReturn(null);

        ResponseEntity<Map<String, Object>> response = certificateController.getCertificate(arbitraryUuid);

        assertEquals(404, response.getStatusCode().value());
    }
}
