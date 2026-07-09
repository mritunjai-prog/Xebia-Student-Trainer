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

    @PutMapping("/{id}")
    public Assessment updateAssessment(@PathVariable String id, @RequestBody Assessment assessment) {
        return assessmentService.updateAssessment(id, assessment);
    }

    @PutMapping("/{id}/allocate")
    public Assessment allocateAssessment(@PathVariable String id, @RequestBody java.util.Map<String, Object> payload) {
        List<String> batches = (List<String>) payload.get("batches");
        String course = (String) payload.get("course");
        return assessmentService.allocateAssessment(id, batches, course);
    }

    @DeleteMapping("/{id}")
    public void deleteAssessment(@PathVariable String id) {
        assessmentService.deleteAssessment(id);
    }
}
