# Assessment Draft API Testing Guide

This guide covers assessment draft save/get APIs for students.

## Run Backend Manually

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

## Login Student

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "STUDENT"
}
```

Use the returned token:

```text
Authorization: Bearer {{studentToken}}
```

## Save Draft

The `studentId` path value must match the logged-in student. The assessment must be published, currently available, and assigned to the student through a batch.

```http
POST /api/v1/assessments/drafts/{{studentId}}/{{assessmentId}}
Authorization: Bearer {{studentToken}}
Content-Type: application/json
```

```json
{
  "draftData": {
    "timeTaken": 180,
    "currentQuestionIndex": 1,
    "answers": [
      {
        "questionId": "paste-question-id",
        "answerText": "extends"
      }
    ]
  }
}
```

Successful response:

```json
{
  "success": true,
  "message": "Draft saved",
  "data": {
    "id": "draft-id",
    "assessmentId": "assessment-id",
    "studentId": "student-id",
    "draftData": {},
    "updatedAt": "2026-07-09T..."
  },
  "errors": []
}
```

## Get Draft

```http
GET /api/v1/assessments/drafts/{{studentId}}/{{assessmentId}}
Authorization: Bearer {{studentToken}}
```

If no draft exists, the response is successful with `data: null`.

## Common Errors

- `401 Only students can access assessment drafts`
- `401 Students can access only their own drafts`
- `401 Student can access drafts only for assigned assessments`
- `400 Drafts are available only for published assessments`
- `400 Assessment has not started yet`
- `400 Assessment has already ended`
- `400 Validation failed` when `draftData` is missing
- `404 Assessment not found`
