package com.xebia.portal.entity;

public final class Enums {
    private Enums() {
    }

    public enum Role { STUDENT, TEACHER }
    public enum BatchStatus { ACTIVE, INACTIVE }
    public enum AssessmentType { QUIZ, CODING, MIXED }
    public enum AssessmentDifficulty { EASY, MEDIUM, HARD }
    public enum AssessmentStatus { DRAFT, PUBLISHED, CLOSED }
    public enum QuestionType { MCQ, TRUE_FALSE, MULTIPLE_SELECT, SHORT_ANSWER, PARAGRAPH, FILE_UPLOAD, CODING }
    public enum SubmissionStatus { STARTED, SUBMITTED, EVALUATED }
    public enum RecipientRole { STUDENT, TEACHER, ALL }
}
