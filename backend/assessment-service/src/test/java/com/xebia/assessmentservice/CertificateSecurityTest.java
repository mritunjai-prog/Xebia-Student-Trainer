package com.xebia.assessmentservice;

import com.xebia.assessmentservice.controller.CertificateController;
import com.xebia.assessmentservice.service.CertificateService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class CertificateSecurityTest {

    @MockBean
    private CertificateService certificateService;

    @Autowired
    private CertificateController certificateController;

    @Test
    public void testUnauthorizedAccessToCertificateBlocked() {
        String arbitraryUuid = "arbitrary-invalid-uuid";
        Mockito.when(certificateService.getCertificateDetails(arbitraryUuid)).thenReturn(null);

        ResponseEntity<Map<String, Object>> response = certificateController.getCertificate(arbitraryUuid);

        assertEquals(404, response.getStatusCode().value());
    }
}
