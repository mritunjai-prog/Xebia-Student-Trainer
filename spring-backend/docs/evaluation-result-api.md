# Evaluation and Result API Testing Guide

This guide covers Phase 4 backend testing for teacher review, manual evaluation, submission results, and scoped submission listing.

## Manual Backend Startup

Use the existing H2 `dev` profile for local API testing only.

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=8082"
```

`spring-boot:run` is long-running by design. Stop it with `Ctrl+C` after testing.

Base URL:

```text
http://localhost:8082
```

## Login Teacher

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

## Login Student

```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "STUDENT"
}
```

Save `data.accessToken` as `{{studentToken}}`.

## Create, Enroll, And Publish Assessment

Use the Phase 1 and Phase 2 APIs to:

1. Create a batch.
2. Get the seeded student ID.
3. Enroll the student into the batch.
4. Create and publish an assessment assigned to that batch.

For manual evaluation testing, include at least one manual question type such as `SHORT_ANSWER`, `PARAGRAPH`, `FILE_UPLOAD`, or `CODING`. Submissions with only objective questions may be auto-evaluated immediately and cannot be manually evaluated.

## Student Starts And Submits Attempt

Start:

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

Submit:

```http
POST /api/v1/submissions/{{submissionId}}/submit
Authorization: Bearer {{studentToken}}
Content-Type: application/json
```

```json
{
  "timeTaken": 540,
  "answers": [
    {
      "questionId": "PASTE_MANUAL_QUESTION_ID",
      "answerText": "Student answer text"
    }
  ]
}
```

After successful final submit, any saved draft for the same student and assessment is deleted.

## Teacher Lists Submissions

Teacher sees only submissions for assessments created by that teacher.

```http
GET /api/v1/submissions
Authorization: Bearer {{teacherToken}}
```

Optional filters:

```http
GET /api/v1/submissions?status=SUBMITTED&assessmentId={{assessmentId}}&studentId={{studentId}}
Authorization: Bearer {{teacherToken}}
```

Students can also call `GET /api/v1/submissions`, but they receive only their own submissions.

## Teacher Gets Result

```http
GET /api/v1/submissions/{{submissionId}}/result
Authorization: Bearer {{teacherToken}}
```

Teachers can view only submissions for assessments they created. Teacher result responses include correct answers/options for review.

## Teacher Manually Evaluates Submission

Manual evaluation is allowed only when submission status is `SUBMITTED`. Already `EVALUATED` submissions are blocked; re-evaluation is not currently supported.

```http
PUT /api/v1/submissions/{{submissionId}}/evaluation
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "overallRemarks": "Good work. Improve explanation clarity.",
  "questionEvaluations": [
    {
      "questionId": "PASTE_MANUAL_QUESTION_ID",
      "marksAwarded": 8,
      "remarks": "Correct approach with minor missing details."
    }
  ]
}
```

Validation rules:

- Question ID must belong to the submitted assessment.
- Duplicate question evaluations are rejected.
- Marks cannot be negative.
- Marks cannot exceed that question's max marks.
- Final score is recalculated as the sum of all answer marks.
- Submission status becomes `EVALUATED`.
- `evaluatedBy`, `evaluatedAt`, and overall remarks are saved.

Objective auto-graded answers are not changed unless the teacher explicitly includes that question in `questionEvaluations`.

## Student Gets Result

```http
GET /api/v1/submissions/{{submissionId}}/result
Authorization: Bearer {{studentToken}}
```

Students can view only their own result. Correct answers/options are included once the submission is evaluated.

## Result Response Includes

- Submission ID and status
- Assessment ID, title, type, and status
- Student ID, name, and email
- Score and percentage
- Started/submitted/evaluated timestamps
- Overall remarks
- Answers with question text, student answer, safe correct answer/options, marks awarded, max marks, answer remarks, correctness, and review status

## Common Errors

- `403 Access denied`: student attempted teacher-only evaluation API.
- `401 Teachers can access only submissions for their own assessments`.
- `401 Students can access only their own submissions`.
- `400 Only submitted, non-evaluated submissions can be evaluated`.
- `400 Evaluation question does not belong to this submission`.
- `400 Duplicate evaluation for question`.
- `400 Marks awarded cannot exceed question marks`.
- `400 Validation failed`: missing evaluations or negative marks.
- `404 Submission not found`.
