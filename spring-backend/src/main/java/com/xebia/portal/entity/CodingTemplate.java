package com.xebia.portal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "coding_templates")
public class CodingTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id")
    private CodingQuestionDetails question;

    @Column(nullable = false, length = 40)
    private String language;

    @Column(name = "starter_code", columnDefinition = "TEXT")
    private String starterCode;
}
