package com.xebia.userservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String name;
    
    @Column(unique = true)
    private String email;
    
    private String role; // "teacher" or "student"
    private String department;
    private String avatar;
    
    // Student specific stats
    private Integer averageScore;
    private Integer assessmentsCompleted;
}
