package com.xebia.portal.dto.request;

import com.xebia.portal.entity.Enums.AssessmentDifficulty;
import com.xebia.portal.entity.Enums.AssessmentStatus;
import com.xebia.portal.entity.Enums.AssessmentType;
import com.xebia.portal.entity.Enums.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AssessmentRequests {
    private AssessmentRequests() {
    }

    public record AssessmentRequest(
            @NotBlank String title,
            String topic,
            String course,
            String subject,
            String description,
            @NotNull AssessmentType type,
            AssessmentDifficulty difficulty,
            AssessmentStatus status,
            @Positive Integer duration,
            @Positive Integer marks,
            @PositiveOrZero Integer passingMarks,
            @Positive Integer maxAttempts,
            Instant startAt,
            Instant endAt,
            Boolean negativeMarking,
            @DecimalMin(value = "0.0") BigDecimal negativeMarksValue,
            Boolean shuffleQuestions,
            Boolean autoSubmit,
            List<@NotNull UUID> batchIds,
            List<@Valid QuestionRequest> questions
    ) {
    }

    public record QuestionRequest(
            UUID id,
            @NotNull QuestionType type,
            @NotBlank String questionText,
            @Positive Integer marks,
            Boolean required,
            String explanation,
            String correctAnswer,
            Integer sortOrder,
            List<@Valid QuestionOptionRequest> options,
            @Valid CodingDetailsRequest codingDetails
    ) {
    }

    public record QuestionOptionRequest(@NotBlank String optionText, Boolean correct, Integer sortOrder) {
    }

    public record CodingDetailsRequest(
            String difficulty,
            @Positive Integer timeLimitMs,
            @Positive Integer memoryLimitMb,
            String constraintsText,
            String inputFormat,
            String outputFormat,
            String sampleInput,
            String sampleOutput,
            String notes,
            String hintsJson,
            String tagsJson,
            String languagesAllowedJson,
            List<@Valid CodingTemplateRequest> templates,
            List<@Valid CodingTestCaseRequest> testCases
    ) {
    }

    public record CodingTemplateRequest(@NotBlank String language, String starterCode) {
    }

    public record CodingTestCaseRequest(String input, @NotBlank String expectedOutput, @Positive Integer weight, String visibility) {
    }
}
