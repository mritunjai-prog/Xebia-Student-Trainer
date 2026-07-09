package com.xebia.portal.dto.response;

import com.xebia.portal.entity.Enums.AssessmentDifficulty;
import com.xebia.portal.entity.Enums.AssessmentStatus;
import com.xebia.portal.entity.Enums.AssessmentType;
import com.xebia.portal.entity.Enums.QuestionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AssessmentResponse(
        UUID id,
        String title,
        String topic,
        String course,
        String subject,
        String description,
        AssessmentType type,
        AssessmentDifficulty difficulty,
        AssessmentStatus status,
        Integer duration,
        Integer marks,
        Integer passingMarks,
        Integer maxAttempts,
        Instant startAt,
        Instant endAt,
        boolean negativeMarking,
        BigDecimal negativeMarksValue,
        boolean shuffleQuestions,
        boolean autoSubmit,
        UUID createdBy,
        Instant createdAt,
        Instant updatedAt,
        List<UUID> batchIds,
        List<QuestionResponse> questions
) {
    public record QuestionResponse(UUID id, QuestionType type, String questionText, Integer marks, boolean required,
                                   String explanation, String correctAnswer, Integer sortOrder,
                                   List<OptionResponse> options, CodingDetailsResponse codingDetails) {
    }

    public record OptionResponse(UUID id, String optionText, boolean correct, Integer sortOrder) {
    }

    public record CodingDetailsResponse(
            String difficulty,
            Integer timeLimitMs,
            Integer memoryLimitMb,
            String constraintsText,
            String inputFormat,
            String outputFormat,
            String sampleInput,
            String sampleOutput,
            String notes,
            String hintsJson,
            String tagsJson,
            String languagesAllowedJson,
            List<CodingTemplateResponse> templates,
            List<CodingTestCaseResponse> testCases
    ) {
    }

    public record CodingTemplateResponse(UUID id, String language, String starterCode) {
    }

    public record CodingTestCaseResponse(UUID id, String input, String expectedOutput, Integer weight, String visibility) {
    }
}
