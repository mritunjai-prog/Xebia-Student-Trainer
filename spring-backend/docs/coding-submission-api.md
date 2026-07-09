# Coding Submission API Testing Guide

This guide covers Phase 5 backend testing for coding run, final coding submit, and coding submission listing.

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

## Important Placeholder Note

Real code execution is not implemented yet. The run API validates access, assessment, question, language, and code, then returns deterministic dummy results. The backend never executes submitted code inside the Spring Boot process.

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

## Create Coding Assessment Overview

Use Phase 1 and Phase 2 APIs to:

1. Create a batch.
2. Get `{{studentId}}`.
3. Enroll the student into `{{batchId}}`.
4. Create a `CODING` or `MIXED` assessment assigned to `{{batchId}}`.

Example coding question:

```json
{
  "type": "CODING",
  "questionText": "Return the sum of two integers.",
  "marks": 20,
  "required": true,
  "codingDetails": {
    "difficulty": "EASY",
    "timeLimitMs": 1000,
    "memoryLimitMb": 128,
    "languagesAllowedJson": "[\"java\"]",
    "templates": [
      {
        "language": "java",
        "starterCode": "public class Solution { public int sum(int a, int b) { return 0; } }"
      }
    ],
    "testCases": [
      {
        "input": "2 3",
        "expectedOutput": "5",
        "weight": 1,
        "visibility": "public"
      }
    ]
  }
}
```

Save the assessment ID as `{{assessmentId}}` and the coding question ID as `{{questionId}}`.

## Publish Coding Assessment

```http
PUT /api/v1/assessments/{{assessmentId}}/publish
Authorization: Bearer {{teacherToken}}
```

## Student Gets Assigned Assessment

```http
GET /api/v1/students/me/assessments
Authorization: Bearer {{studentToken}}
```

Only published assessments assigned through the student's batch are returned.

## Student Runs Code

```http
POST /api/v1/coding-submissions/run
Authorization: Bearer {{studentToken}}
Content-Type: application/json
```

```json
{
  "assessmentId": "{{assessmentId}}",
  "questionId": "{{questionId}}",
  "language": "java",
  "code": "public class Solution { public int sum(int a, int b) { return a + b; } }",
  "customInput": "2 3"
}
```

Response includes placeholder `status`, `passed`, `output`, `executionTime`, `memoryUsed`, `testCaseResults`, and a message explaining that sandbox execution is not enabled.

## Student Submits Code

```http
POST /api/v1/coding-submissions
Authorization: Bearer {{studentToken}}
Content-Type: application/json
```

```json
{
  "assessmentId": "{{assessmentId}}",
  "questionId": "{{questionId}}",
  "language": "java",
  "code": "public class Solution { public int sum(int a, int b) { return a + b; } }"
}
```

If no active parent submission exists, the backend creates a `STARTED` submission after validating assignment and max attempts. The coding submission is saved with status `PENDING_SECURE_SANDBOX` and score `0`.

## Student Lists Own Coding Submissions

```http
GET /api/v1/coding-submissions?assessmentId={{assessmentId}}&questionId={{questionId}}
Authorization: Bearer {{studentToken}}
```

Students can see only their own coding submissions.

## Teacher Lists Coding Submissions

```http
GET /api/v1/coding-submissions?assessmentId={{assessmentId}}&studentId={{studentId}}&questionId={{questionId}}
Authorization: Bearer {{teacherToken}}
```

Teachers can see only coding submissions for assessments they created.

## Common Errors

- `403 Access denied`: teacher tried to run/submit code.
- `401 Students can access only their own coding submissions`.
- `401 Student can submit code only for assigned assessments`.
- `400 Assessment must be published before coding submissions are allowed`.
- `400 Assessment has not started yet`.
- `400 Assessment has already ended`.
- `400 Coding submissions require a CODING or MIXED assessment`.
- `400 Question must be a CODING question`.
- `400 Question does not belong to the requested assessment`.
- `400 Unsupported language for this coding question`.
- `400 Maximum assessment attempts exceeded`.
- `404 Question not found`.
- `404 Submission not found`.
