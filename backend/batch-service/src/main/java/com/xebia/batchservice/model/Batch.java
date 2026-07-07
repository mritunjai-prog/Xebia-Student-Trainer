package com.xebia.batchservice.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Batch {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String name;
    private String course;
    private Integer studentCount;
    private String status; // active, completed
    private String createdAt;
    private String icon;
    
    @ElementCollection
    private List<String> students;
}
