package com.xebia.portal.controller;

import com.xebia.portal.dto.request.SubmissionRequests;
import com.xebia.portal.dto.response.ApiResponse;
import com.xebia.portal.entity.Enums.SubmissionStatus;
import com.xebia.portal.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/submissions")
public class SubmissionController {
    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping("/start")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse> start(@Valid @RequestBody SubmissionRequests.StartSubmissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Submission started", submissionService.start(request)));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse submit(@PathVariable UUID id, @Valid @RequestBody SubmissionRequests.SubmitSubmissionRequest request) {
        return ApiResponse.success("Submission submitted", submissionService.submit(id, request));
    }

    @GetMapping
    public ApiResponse getSubmissions(@RequestParam(required = false) UUID studentId,
                                      @RequestParam(required = false) UUID assessmentId,
                                      @RequestParam(required = false) SubmissionStatus status) {
        return ApiResponse.success("Submissions fetched", submissionService.getSubmissions(studentId, assessmentId, status));
    }

    @GetMapping("/{id}/result")
    public ApiResponse getResult(@PathVariable UUID id) {
        return ApiResponse.success("Submission result fetched", submissionService.getResult(id));
    }

    @PutMapping("/{id}/evaluation")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse evaluate(@PathVariable UUID id, @Valid @RequestBody SubmissionRequests.EvaluationRequest request) {
        return ApiResponse.success("Submission evaluated", submissionService.evaluate(id, request));
    }
}
