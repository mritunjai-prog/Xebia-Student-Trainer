import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content.strip() + '\n')

BASE_DIR = r"d:\Xebia-LMS-Backend"

# --- USER SERVICE ---
USER_PKG = os.path.join(BASE_DIR, "user-service/src/main/java/com/xebia/userservice")

create_file(os.path.join(USER_PKG, "model/User.java"), """
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
""")

create_file(os.path.join(USER_PKG, "repository/UserRepository.java"), """
package com.xebia.userservice.repository;

import com.xebia.userservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserRepository extends JpaRepository<User, String> {
    List<User> findByRole(String role);
}
""")

create_file(os.path.join(USER_PKG, "service/UserService.java"), """
package com.xebia.userservice.service;

import com.xebia.userservice.model.User;
import com.xebia.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }
}
""")

create_file(os.path.join(USER_PKG, "controller/UserController.java"), """
package com.xebia.userservice.controller;

import com.xebia.userservice.model.User;
import com.xebia.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers(@RequestParam(required = false) String role) {
        if (role != null) {
            return userService.getUsersByRole(role);
        }
        return userService.getAllUsers();
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }
}
""")

# --- BATCH SERVICE ---
BATCH_PKG = os.path.join(BASE_DIR, "batch-service/src/main/java/com/xebia/batchservice")

create_file(os.path.join(BATCH_PKG, "model/Batch.java"), """
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
    
    @ElementCollection
    private List<String> studentIds;
}
""")

create_file(os.path.join(BATCH_PKG, "repository/BatchRepository.java"), """
package com.xebia.batchservice.repository;

import com.xebia.batchservice.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BatchRepository extends JpaRepository<Batch, String> {
}
""")

create_file(os.path.join(BATCH_PKG, "service/BatchService.java"), """
package com.xebia.batchservice.service;

import com.xebia.batchservice.model.Batch;
import com.xebia.batchservice.repository.BatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BatchService {
    @Autowired
    private BatchRepository batchRepository;

    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }

    public Batch createBatch(Batch batch) {
        return batchRepository.save(batch);
    }
}
""")

create_file(os.path.join(BATCH_PKG, "controller/BatchController.java"), """
package com.xebia.batchservice.controller;

import com.xebia.batchservice.model.Batch;
import com.xebia.batchservice.service.BatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/batches")
@CrossOrigin(origins = "*")
public class BatchController {

    @Autowired
    private BatchService batchService;

    @GetMapping
    public List<Batch> getAllBatches() {
        return batchService.getAllBatches();
    }

    @PostMapping
    public Batch createBatch(@RequestBody Batch batch) {
        return batchService.createBatch(batch);
    }
}
""")

# --- ASSESSMENT SERVICE ---
ASS_PKG = os.path.join(BASE_DIR, "assessment-service/src/main/java/com/xebia/assessmentservice")

create_file(os.path.join(ASS_PKG, "model/Assessment.java"), """
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
    private String status; // draft, published, archived
    private String type; // mcq, assignment, mixed
    private String createdBy;
    private String createdAt;
    
    @ElementCollection
    private List<String> batches;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "assessment_id")
    private List<Question> questions;
}
""")

create_file(os.path.join(ASS_PKG, "model/Question.java"), """
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
""")

create_file(os.path.join(ASS_PKG, "model/Submission.java"), """
package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String assessmentId;
    private String studentId;
    private String status; // in_progress, submitted
    private String startedAt;
    private String submittedAt;
    private Integer score;
    private Integer percentage;
    private Integer timeTaken;
    private Boolean isEvaluated;
    @Column(columnDefinition = "TEXT")
    private String remarks;
    private String evaluatedBy;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "submission_id")
    private List<Answer> answers;
}
""")

create_file(os.path.join(ASS_PKG, "model/Answer.java"), """
package com.xebia.assessmentservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Answer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String questionId;
    @Column(columnDefinition = "TEXT")
    private String answer;
    private Integer marksAwarded;
    @Column(columnDefinition = "TEXT")
    private String remarks;
}
""")

create_file(os.path.join(ASS_PKG, "repository/AssessmentRepository.java"), """
package com.xebia.assessmentservice.repository;

import com.xebia.assessmentservice.model.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssessmentRepository extends JpaRepository<Assessment, String> {
}
""")

create_file(os.path.join(ASS_PKG, "repository/SubmissionRepository.java"), """
package com.xebia.assessmentservice.repository;

import com.xebia.assessmentservice.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, String> {
    List<Submission> findByAssessmentId(String assessmentId);
    List<Submission> findByStudentId(String studentId);
}
""")

create_file(os.path.join(ASS_PKG, "service/AssessmentService.java"), """
package com.xebia.assessmentservice.service;

import com.xebia.assessmentservice.model.Assessment;
import com.xebia.assessmentservice.repository.AssessmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssessmentService {
    @Autowired
    private AssessmentRepository assessmentRepository;

    public List<Assessment> getAllAssessments() {
        return assessmentRepository.findAll();
    }

    public Assessment createAssessment(Assessment assessment) {
        return assessmentRepository.save(assessment);
    }
}
""")

create_file(os.path.join(ASS_PKG, "service/SubmissionService.java"), """
package com.xebia.assessmentservice.service;

import com.xebia.assessmentservice.model.Submission;
import com.xebia.assessmentservice.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubmissionService {
    @Autowired
    private SubmissionRepository submissionRepository;

    public List<Submission> getAllSubmissions() {
        return submissionRepository.findAll();
    }
    
    public List<Submission> getSubmissionsByStudent(String studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    public Submission createSubmission(Submission submission) {
        return submissionRepository.save(submission);
    }
}
""")

create_file(os.path.join(ASS_PKG, "controller/AssessmentController.java"), """
package com.xebia.assessmentservice.controller;

import com.xebia.assessmentservice.model.Assessment;
import com.xebia.assessmentservice.service.AssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assessments")
@CrossOrigin(origins = "*")
public class AssessmentController {

    @Autowired
    private AssessmentService assessmentService;

    @GetMapping
    public List<Assessment> getAllAssessments() {
        return assessmentService.getAllAssessments();
    }

    @PostMapping
    public Assessment createAssessment(@RequestBody Assessment assessment) {
        return assessmentService.createAssessment(assessment);
    }
}
""")

create_file(os.path.join(ASS_PKG, "controller/SubmissionController.java"), """
package com.xebia.assessmentservice.controller;

import com.xebia.assessmentservice.model.Submission;
import com.xebia.assessmentservice.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions")
@CrossOrigin(origins = "*")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @GetMapping
    public List<Submission> getAllSubmissions(@RequestParam(required = false) String studentId) {
        if (studentId != null) {
            return submissionService.getSubmissionsByStudent(studentId);
        }
        return submissionService.getAllSubmissions();
    }

    @PostMapping
    public Submission createSubmission(@RequestBody Submission submission) {
        return submissionService.createSubmission(submission);
    }
}
""")

print("Backend scaffolding completed successfully!")
