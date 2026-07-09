# Submission API Testing Guide

This guide covers Phase 3 backend testing for student assessment attempts, quiz submission, auto-grading, and results.

## Run Backend In Dev Profile Manually

Use the existing H2 `dev` profile for local API testing only.

PowerShell:

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=8082"
```

Stop the long-running server with `Ctrl+C` after testing.

Base URL:

```text
http://localhost:8082
```

## Login As Teacher

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "teacher@example.com",
  "password": "password123",
  "role": "TEACHER"
}
```

Save `data.accessToken` as `{{teacherToken}}`.

## Login As Student

```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "STUDENT"
}
```

Save `data.accessToken` as `{{studentToken}}`.

## Create Batch

```http
POST /api/v1/batches
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "name": "Submission API Batch",
  "course": "Backend Development",
  "icon": "BookOpen",
  "status": "ACTIVE",
  "studentIds": []
}
```

Save `data.id` as `{{batchId}}`.

## Enroll Student

First get the seeded student:

```http
GET /api/v1/users?role=STUDENT
Authorization: Bearer {{teacherToken}}
```

Save the student `id` as `{{studentId}}`.

Enroll into the batch:

```http
PUT /api/v1/batches/{{batchId}}/students
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "studentIds": ["{{studentId}}"]
}
```

## Create Assessment

Create a published quiz assessment assigned to the batch. Save the returned `data.id` as `{{assessmentId}}` and the returned question IDs for submission.

```http
POST /api/v1/assessments
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "title": "Submission Flow Quiz",
  "topic": "Java Basics",
  "course": "Backend Development",
  "subject": "Java",
  "type": "QUIZ",
  "difficulty": "EASY",
  "status": "PUBLISHED",
  "duration": 30,
  "marks": 15,
  "passingMarks": 8,
  "maxAttempts": 1,
  "negativeMarking": false,
  "negativeMarksValue": 0,
  "shuffleQuestions": false,
  "autoSubmit": true,
  "batchIds": ["{{batchId}}"],
  "questions": [
    {
      "type": "MCQ",
      "questionText": "Which keyword creates a subclass in Java?",
      "marks": 5,
      "required": true,
      "options": [
        { "optionText": "extends", "correct": true },
        { "optionText": "implements", "correct": false }
      ]
    },
    {
      "type": "TRUE_FALSE",
      "questionText": "Java supports interfaces.",
      "marks": 5,
      "required": true,
      "options": [
        { "optionText": "true", "correct": true },
        { "optionText": "false", "correct": false }
      ]
    },
    {
      "type": "MULTIPLE_SELECT",
      "questionText": "Select valid Java access modifiers.",
      "marks": 5,
      "required": true,
      "options": [
        { "optionText": "public", "correct": true },
        { "optionText": "private", "correct": true },
        { "optionText": "internal", "correct": false }
      ]
    }
  ]
}
```

## Publish Assessment

If the assessment was created as `DRAFT`, publish it:

```http
PUT /api/v1/assessments/{{assessmentId}}/publish
Authorization: Bearer {{teacherToken}}
```

## Student Gets Assigned Assessments

```http
GET /api/v1/students/me/assessments
Authorization: Bearer {{studentToken}}
```

Only published assessments assigned through the student's batch are returned.

## Student Starts Attempt

```http
POST /api/v1/submissions/start
Authorization: Bearer {{studentToken}}
Content-Type: application/json
```

```json
{
  "assessmentId": "{{assessmentId}}"
}
```

Save `data.id` as `{{submissionId}}`.

If a `STARTED` submission already exists for the student and assessment, the same started submission is returned.

## Student Submits MCQ Answers

Use the real question IDs from the assessment response.

```http
POST /api/v1/submissions/{{submissionId}}/submit
Authorization: Bearer {{studentToken}}
Content-Type: application/json
```

```json
{
  "timeTaken": 420,
  "answers": [
    {
      "questionId": "{{mcqQuestionId}}",
      "answerText": "extends"
    },
    {
      "questionId": "{{trueFalseQuestionId}}",
      "answerText": "true"
    },
    {
      "questionId": "{{multipleSelectQuestionId}}",
      "answerJson": "[\"public\", \"private\"]"
    }
  ]
}
```

Objective questions are auto-graded:

- `MCQ`: exact option text match, case-insensitive
- `TRUE_FALSE`: exact option text match, case-insensitive
- `MULTIPLE_SELECT`: selected option set must match the correct option set

Short answer, paragraph, file upload, and coding answers remain pending/manual when submitted.

## Student Views Result

```http
GET /api/v1/submissions/{{submissionId}}/result
Authorization: Bearer {{studentToken}}
```

Students can view only their own results.

## Teacher Lists Submissions

```http
GET /api/v1/submissions
Authorization: Bearer {{teacherToken}}
```

Teachers see only submissions for assessments they created. To filter by student:

```http
GET /api/v1/submissions?studentId={{studentId}}
Authorization: Bearer {{teacherToken}}
```

## Draft APIs

The codebase currently has `AssessmentDraft` and `AssessmentDraftRepository`, but no draft controller/service endpoints are exposed yet for:

- `POST /api/v1/assessments/drafts/{studentId}/{assessmentId}`
- `GET /api/v1/assessments/drafts/{studentId}/{assessmentId}`

They are therefore not included in the request collection.

## Common Errors

- `400 Only published assessments can be started`
- `401 Student can start only assigned assessments`
- `400 Assessment has not started yet`
- `400 Assessment has already ended`
- `400 Maximum assessment attempts exceeded`
- `400 Submission has already been submitted`
- `400 Required question is missing an answer`
- `400 Required question answer is empty`
- `400 Answer question does not belong to this assessment`
- `400 Duplicate answer for question`
- `401 Students can access only their own submissions`
- `401 Teachers can access only submissions for their own assessments`
- `404 Assessment not found`
- `404 Submission not found`
