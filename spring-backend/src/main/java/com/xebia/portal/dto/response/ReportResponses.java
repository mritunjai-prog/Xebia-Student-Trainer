package com.xebia.portal.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class ReportResponses {
    private ReportResponses() {
    }

    public record OverviewReportResponse(long totalAssessments, long totalSubmissions, long evaluatedSubmissions,
                                         long pendingEvaluations, BigDecimal averageScore, BigDecimal highestScore,
                                         BigDecimal lowestScore, BigDecimal passRate,
                                         List<ScoreBucket> scoreDistribution) {
    }

    public record BatchReportResponse(UUID batchId, String batchName, long studentCount,
                                      long assignedAssessmentCount, long submissionCount,
                                      BigDecimal averageScore, BigDecimal passRate) {
    }

    public record StudentReportResponse(UUID studentId, String studentName, String email, BigDecimal averageScore,
                                        BigDecimal highestScore, long attemptsCount, long completedCount,
                                        long evaluatedCount, long pendingEvaluations,
                                        List<UUID> batchIds, List<String> batchNames) {
    }

    public record ScoreBucket(String label, long count) {
    }
}
