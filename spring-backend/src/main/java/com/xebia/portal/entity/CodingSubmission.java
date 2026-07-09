package com.xebia.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "coding_submissions")
public class CodingSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id")
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id")
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id")
    private User student;

    @Column(length = 40)
    private String language;

    @Column(columnDefinition = "TEXT")
    private String code;

    private BigDecimal score = BigDecimal.ZERO;

    @Column(length = 40)
    private String status;

    private Integer timeTaken;
    private BigDecimal memoryUsed;
    private Instant submittedAt;

    @OneToMany(mappedBy = "codingSubmission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CodingTestResult> testResults = new ArrayList<>();
}
