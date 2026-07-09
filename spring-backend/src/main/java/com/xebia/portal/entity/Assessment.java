package com.xebia.portal.entity;

import com.xebia.portal.entity.Enums.AssessmentDifficulty;
import com.xebia.portal.entity.Enums.AssessmentStatus;
import com.xebia.portal.entity.Enums.AssessmentType;
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
@Table(name = "assessments")
public class Assessment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String topic;

    @Column(length = 150)
    private String course;

    @Column(length = 150)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AssessmentType type = AssessmentType.QUIZ;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssessmentDifficulty difficulty = AssessmentDifficulty.EASY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AssessmentStatus status = AssessmentStatus.DRAFT;

    private Integer duration;
    private Integer marks;
    private Integer passingMarks;
    private Integer maxAttempts = 1;
    private Instant startAt;
    private Instant endAt;
    private boolean negativeMarking;
    private BigDecimal negativeMarksValue = BigDecimal.ZERO;
    private boolean shuffleQuestions;
    private boolean autoSubmit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<Question> questions = new ArrayList<>();

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssessmentBatch> assignedBatches = new ArrayList<>();

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
