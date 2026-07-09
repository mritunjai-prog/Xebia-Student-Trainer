package com.xebia.portal.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record LeaderboardResponse(
        int rank,
        UUID studentId,
        String studentName,
        String email,
        String avatarUrl,
        List<String> batchNames,
        BigDecimal totalScore,
        BigDecimal averageScore,
        BigDecimal bestScore,
        long completedAssessments
) {
}
