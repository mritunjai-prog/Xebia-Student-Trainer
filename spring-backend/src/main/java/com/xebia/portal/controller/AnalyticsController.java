package com.xebia.portal.controller;

import com.xebia.portal.dto.response.ApiResponse;
import com.xebia.portal.service.AnalyticsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/api/v1/dashboard/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse teacherDashboard() {
        return ApiResponse.success("Teacher dashboard fetched", analyticsService.teacherDashboard());
    }

    @GetMapping("/api/v1/dashboard/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse studentDashboard() {
        return ApiResponse.success("Student dashboard fetched", analyticsService.studentDashboard());
    }

    @GetMapping("/api/v1/reports/overview")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse overviewReport() {
        return ApiResponse.success("Overview report fetched", analyticsService.overviewReport());
    }

    @GetMapping("/api/v1/reports/batches")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse batchReports() {
        return ApiResponse.success("Batch reports fetched", analyticsService.batchReports());
    }

    @GetMapping("/api/v1/reports/students")
    @PreAuthorize("hasRole('TEACHER')")
    public ApiResponse studentReports(@RequestParam(required = false) UUID batchId,
                                      @RequestParam(required = false) UUID assessmentId,
                                      @RequestParam(required = false) String search) {
        return ApiResponse.success("Student reports fetched", analyticsService.studentReports(batchId, assessmentId, search));
    }

    @GetMapping("/api/v1/leaderboard")
    public ApiResponse leaderboard(@RequestParam(required = false) UUID batchId,
                                   @RequestParam(required = false) UUID assessmentId) {
        return ApiResponse.success("Leaderboard fetched", analyticsService.leaderboard(batchId, assessmentId));
    }
}
