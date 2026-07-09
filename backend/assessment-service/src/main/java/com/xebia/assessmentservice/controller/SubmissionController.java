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
    
    @GetMapping("/{id}")
    public Submission getSubmissionById(@PathVariable String id, @RequestParam(required = false) String role) {
        return submissionService.getSubmissionByIdMasked(id, role);
    }

    @PostMapping
    public Submission createSubmission(@RequestBody Submission submission) {
        return submissionService.createSubmission(submission);
    }
}
