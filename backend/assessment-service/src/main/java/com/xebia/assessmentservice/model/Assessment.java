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
    private String status; // draft, published, archived
    private String type; // mcq, assignment, mixed
    private String createdBy;
    private String createdAt;
    
    private String topic;
    private Boolean shuffleQuestions;
    private Boolean randomizeOptions;
    private Boolean negativeMarking;
    private Integer negativeMarksValue;
    private Boolean autoSubmit;
    
    @ElementCollection
    private List<String> batches;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "assessment_id")
    private List<Question> questions;
}
