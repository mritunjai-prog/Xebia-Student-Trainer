package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "assessments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Assessment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String title;
    private String description;
    @Column(columnDefinition = "TEXT")
    private String instructions;

    private String difficulty;
    private Integer marks;
    private Integer passingMarks;
    private Integer duration;
    private String startDate;
    private String startTime;
    private String endDate;
    private String endTime;
    private Integer attemptsAllowed;
    private Boolean autoGrade;
    private Boolean manualGrade;
    @Enumerated(EnumType.STRING)
    private AssessmentStatus status; // DRAFT, UNALLOCATED, PUBLISHED, ARCHIVED
    private String type; // mcq, assignment, mixed
    private String createdBy;
    private String createdAt;

    private String topic;
    private String course;
    private String subject;
    private Boolean shuffleQuestions;
    private Boolean randomizeOptions;
    private Boolean negativeMarking;
    private Integer negativeMarksValue;
    private Boolean autoSubmit;
    
    private String scoreReleasePolicy; // IMMEDIATE_ON_SUBMISSION, MANUAL_RELEASE_BY_TRAINER

    private Boolean certificateEnabled;
    private String certificateTemplate;
    private String certificateTitle;
    private String certificateSignatory;
    private String certificateSignatoryTitle;
    private String certificateCorporateLine;
    private String certificateCustomBg;
    private String certificateTitleColor;
    private String certificateNameColor;
    private String certificateBorderColor;
    private String certificateSealColor;
    private String certificateSealText;
    private String lastModifiedBy;
    private String modificationReason;

    @ElementCollection
    private List<String> batches;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "assessment_id")
    private List<Question> questions;
}
