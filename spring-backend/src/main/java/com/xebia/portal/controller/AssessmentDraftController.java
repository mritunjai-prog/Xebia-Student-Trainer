package com.xebia.portal.controller;

import com.xebia.portal.dto.request.DraftRequests;
import com.xebia.portal.dto.response.ApiResponse;
import com.xebia.portal.service.AssessmentDraftService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assessments/drafts")
@PreAuthorize("hasRole('STUDENT')")
public class AssessmentDraftController {
    private final AssessmentDraftService draftService;

    public AssessmentDraftController(AssessmentDraftService draftService) {
        this.draftService = draftService;
    }

    @PostMapping("/{studentId}/{assessmentId}")
    public ResponseEntity<ApiResponse> saveDraft(@PathVariable UUID studentId,
                                                 @PathVariable UUID assessmentId,
                                                 @Valid @RequestBody DraftRequests.SaveDraftRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Draft saved", draftService.saveDraft(studentId, assessmentId, request)));
    }

    @GetMapping("/{studentId}/{assessmentId}")
    public ApiResponse getDraft(@PathVariable UUID studentId, @PathVariable UUID assessmentId) {
        return ApiResponse.success("Draft fetched", draftService.getDraft(studentId, assessmentId));
    }
}
