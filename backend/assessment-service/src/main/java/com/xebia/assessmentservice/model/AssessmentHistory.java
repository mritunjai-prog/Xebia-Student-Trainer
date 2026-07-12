package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String assessmentId;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    private String topic;
    private String difficulty;
    private Integer marks;
    private Integer duration;
    
    private String lastModifiedBy;
    
    @Column(columnDefinition = "TEXT")
    private String modificationReason;
    
    private LocalDateTime modifiedAt;
    
    private Integer version;
}
