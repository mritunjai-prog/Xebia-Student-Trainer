package com.xebia.portal.service;

import com.xebia.portal.dto.response.DashboardResponses;
import com.xebia.portal.dto.response.LeaderboardResponse;
import com.xebia.portal.dto.response.ReportResponses;

import java.util.List;
import java.util.UUID;

public interface AnalyticsService {
    DashboardResponses.TeacherDashboardResponse teacherDashboard();
    DashboardResponses.StudentDashboardResponse studentDashboard();
    ReportResponses.OverviewReportResponse overviewReport();
    List<ReportResponses.BatchReportResponse> batchReports();
    List<ReportResponses.StudentReportResponse> studentReports(UUID batchId, UUID assessmentId, String search);
    List<LeaderboardResponse> leaderboard(UUID batchId, UUID assessmentId);
}
