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
    private List<String> options;
    
    private String correctAnswer;
    @Column(columnDefinition = "TEXT")
    private String explanation;
}
