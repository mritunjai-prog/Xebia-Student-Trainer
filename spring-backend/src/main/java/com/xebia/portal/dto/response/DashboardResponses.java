package com.xebia.portal.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class DashboardResponses {
    private DashboardResponses() {
    }

    public record TeacherDashboardResponse(long totalStudents, long totalBatches, long totalAssessments,
                                           long totalSubmissions, long pendingEvaluations, BigDecimal averageScore,
                                           List<SubmissionSummary> recentSubmissions,
                                           List<AssessmentSummary> activeAssessments,
                                           List<MetricPoint> submissionTrend) {
    }

    public record StudentDashboardResponse(long activeAssessments, long upcomingAssessments, long completedAssessments,
                                           long pendingEvaluations, BigDecimal averageScore, BigDecimal bestScore,
                                           Integer leaderboardRank, List<AssessmentSummary> recentScores,
                                           List<AssessmentSummary> assignedAssessments) {
    }

    public record MetricPoint(String label, BigDecimal value) {
    }

    public record AssessmentSummary(UUID id, String title, BigDecimal percentage, boolean evaluated) {
    }

    public record SubmissionSummary(UUID id, UUID assessmentId, String assessmentTitle, UUID studentId,
                                    String studentName, BigDecimal percentage, String status) {
    }
}
