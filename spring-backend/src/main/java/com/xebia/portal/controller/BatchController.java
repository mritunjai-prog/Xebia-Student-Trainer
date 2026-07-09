package com.xebia.portal.controller;

import com.xebia.portal.dto.request.BatchRequests;
import com.xebia.portal.dto.response.ApiResponse;
import com.xebia.portal.service.BatchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/batches")
@PreAuthorize("hasRole('TEACHER')")
public class BatchController {
    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @GetMapping
    public ApiResponse getBatches() {
        return ApiResponse.success("Batches fetched", batchService.getBatches());
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createBatch(@Valid @RequestBody BatchRequests.BatchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Batch created", batchService.createBatch(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse getBatch(@PathVariable UUID id) {
        return ApiResponse.success("Batch fetched", batchService.getBatch(id));
    }

    @PutMapping("/{id}")
    public ApiResponse updateBatch(@PathVariable UUID id, @Valid @RequestBody BatchRequests.BatchRequest request) {
        return ApiResponse.success("Batch updated", batchService.updateBatch(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBatch(@PathVariable UUID id) {
        batchService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.success("Batch deleted"));
    }

    @PutMapping("/{id}/students")
    public ApiResponse replaceStudents(@PathVariable UUID id, @Valid @RequestBody BatchRequests.BatchStudentsRequest request) {
        return ApiResponse.success("Batch students updated", batchService.replaceStudents(id, request));
    }
}
