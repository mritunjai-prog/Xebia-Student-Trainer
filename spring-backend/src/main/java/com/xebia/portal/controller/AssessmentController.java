package com.xebia.portal.controller;

import com.xebia.portal.dto.request.AssessmentRequests;
import com.xebia.portal.dto.response.ApiResponse;
import com.xebia.portal.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class AssessmentController {
    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @GetMapping("/api/v1/assessments")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse getAssessments() {
        return ApiResponse.success("Assessments fetched", assessmentService.getAssessments());
    }

    @PostMapping("/api/v1/assessments")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse> createAssessment(@Valid @RequestBody AssessmentRequests.AssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assessment created", assessmentService.createAssessment(request)));
    }

    @GetMapping("/api/v1/assessments/{id}")
    public ApiResponse getAssessment(@PathVariable UUID id) {
        return ApiResponse.success("Assessment fetched", assessmentService.getAssessment(id));
    }

    @PutMapping("/api/v1/assessments/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse updateAssessment(@PathVariable UUID id, @Valid @RequestBody AssessmentRequests.AssessmentRequest request) {
        return ApiResponse.success("Assessment updated", assessmentService.updateAssessment(id, request));
    }

    @DeleteMapping("/api/v1/assessments/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse> deleteAssessment(@PathVariable UUID id) {
        assessmentService.deleteAssessment(id);
        return ResponseEntity.ok(ApiResponse.success("Assessment deleted"));
    }

    @PutMapping("/api/v1/assessments/{id}/publish")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse publish(@PathVariable UUID id) {
        return ApiResponse.success("Assessment published", assessmentService.publish(id));
    }

    @PostMapping("/api/v1/assessments/{id}/duplicate")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse> duplicate(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assessment duplicated", assessmentService.duplicate(id)));
    }

    @GetMapping("/api/v1/students/me/assessments")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse getCurrentStudentAssessments() {
        return ApiResponse.success("Student assessments fetched", assessmentService.getCurrentStudentAssessments());
    }
}
