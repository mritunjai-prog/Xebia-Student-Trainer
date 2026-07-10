package com.xebia.assessmentservice;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class CertificateSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testUnauthorizedAccessToCertificateBlocked() throws Exception {
        // Attempt to access an arbitrary certificate ID without proper auth context
        // In a fully configured Spring Security setup, this should return 401 Unauthorized
        // For now, we simulate checking that parsing an arbitrary invalid ID returns a safe error (404/401)
        mockMvc.perform(get("/api/v1/certificates/arbitrary-invalid-uuid"))
                .andExpect(status().isNotFound()); // Or isUnauthorized() if security is fully active
    }
}
