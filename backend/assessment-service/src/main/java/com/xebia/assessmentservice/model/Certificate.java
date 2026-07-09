package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates", indexes = {
    @Index(name = "idx_cert_uuid", columnList = "certificateUuid"),
    @Index(name = "idx_user_id", columnList = "userId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, unique = true)
    private String certificateUuid;
    
    @Column(nullable = false, unique = true)
    private String serialNumber;
    
    @Column(nullable = false)
    private String userId;
    
    @Column(nullable = false)
    private String assessmentId;
    
    @Column(nullable = false)
    private String submissionId;
    
    @Column(nullable = false)
    private LocalDateTime issuedAt;
    
    @Column(nullable = false)
    private Double finalScore;
}
