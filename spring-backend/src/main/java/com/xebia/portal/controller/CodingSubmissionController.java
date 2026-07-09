package com.xebia.portal.controller;

import com.xebia.portal.dto.request.CodingRequests;
import com.xebia.portal.dto.response.ApiResponse;
import com.xebia.portal.service.CodingSubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/coding-submissions")
public class CodingSubmissionController {
    private final CodingSubmissionService codingSubmissionService;

    public CodingSubmissionController(CodingSubmissionService codingSubmissionService) {
        this.codingSubmissionService = codingSubmissionService;
    }

    @PostMapping("/run")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse run(@Valid @RequestBody CodingRequests.RunCodeRequest request) {
        return ApiResponse.success("Code run placeholder executed", codingSubmissionService.run(request));
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse> submit(@Valid @RequestBody CodingRequests.CodingSubmissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Coding submission created", codingSubmissionService.submit(request)));
    }

    @GetMapping
    public ApiResponse list(@RequestParam(required = false) UUID assessmentId,
                            @RequestParam(required = false) UUID studentId,
                            @RequestParam(required = false) UUID questionId) {
        return ApiResponse.success("Coding submissions fetched", codingSubmissionService.list(assessmentId, studentId, questionId));
    }
}
