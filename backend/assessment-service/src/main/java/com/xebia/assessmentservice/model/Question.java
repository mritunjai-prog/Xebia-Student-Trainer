package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String type;
    @Column(columnDefinition = "TEXT")
    private String question;
    private Integer marks;
    private Boolean required;
    
    @ElementCollection
    @Column(columnDefinition = "TEXT")
    private List<String> options;
    
    @Column(columnDefinition = "TEXT")
    private String correctAnswer;
    @Column(columnDefinition = "TEXT")
    private String explanation;
}
