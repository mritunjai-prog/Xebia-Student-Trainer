package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates", indexes = {
    @Index(name = "idx_certificate_user", columnList = "userId"),
    @Index(name = "idx_certificate_uuid", columnList = "certificateUuid", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Certificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
