# Assessment API Testing Guide

This guide covers Phase 2 backend testing for assessments only. It uses the existing `dev` profile with H2 in-memory storage for temporary local API testing.

## Run Backend In Dev Profile

PowerShell:

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=8082"
```

Git Bash or macOS/Linux shells:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments=--server.port=8082
```

The server is long-running by design. After logs show `Started PortalApplication`, keep it running while testing or stop it with `Ctrl+C`.

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

Use the returned access token:

```text
Authorization: Bearer {{teacherToken}}
```

## Login As Student

```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "STUDENT"
}
```

## Create Batch

Teacher token required.

```http
POST /api/v1/batches
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "name": "Assessment API Batch",
  "course": "Backend Development",
  "icon": "BookOpen",
  "status": "ACTIVE",
  "studentIds": []
}
```

Save `data.id` as `{{batchId}}`.

## Get Student Id

Teacher token required.

```http
GET /api/v1/users?role=STUDENT
Authorization: Bearer {{teacherToken}}
```

Save the seeded student's `data[0].id` as `{{studentId}}`.

## Enroll Student Into Batch

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

## Create Assessment With Assigned Batch

Teacher token required. This creates a draft mixed assessment assigned to the batch.

```http
POST /api/v1/assessments
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "title": "Java Basics Assessment",
  "topic": "Java Fundamentals",
  "course": "Backend Development",
  "subject": "Java",
  "description": "Quiz and coding assessment for backend trainees.",
  "type": "MIXED",
  "difficulty": "MEDIUM",
  "status": "DRAFT",
  "duration": 60,
  "marks": 30,
  "passingMarks": 15,
  "maxAttempts": 1,
  "negativeMarking": false,
  "negativeMarksValue": 0,
  "shuffleQuestions": true,
  "autoSubmit": true,
  "batchIds": ["{{batchId}}"],
  "questions": [
    {
      "type": "MCQ",
      "questionText": "Which keyword creates a subclass in Java?",
      "marks": 5,
      "required": true,
      "explanation": "Java uses extends for class inheritance.",
      "sortOrder": 0,
      "options": [
        { "optionText": "extends", "correct": true, "sortOrder": 0 },
        { "optionText": "implements", "correct": false, "sortOrder": 1 },
        { "optionText": "inherits", "correct": false, "sortOrder": 2 },
        { "optionText": "super", "correct": false, "sortOrder": 3 }
      ]
    },
    {
      "type": "MULTIPLE_SELECT",
      "questionText": "Which are valid Java access modifiers?",
      "marks": 5,
      "required": true,
      "sortOrder": 1,
      "options": [
        { "optionText": "public", "correct": true, "sortOrder": 0 },
        { "optionText": "private", "correct": true, "sortOrder": 1 },
        { "optionText": "protected", "correct": true, "sortOrder": 2 },
        { "optionText": "internal", "correct": false, "sortOrder": 3 }
      ]
    },
    {
      "type": "CODING",
      "questionText": "Write a function that returns the sum of two integers.",
      "marks": 20,
      "required": true,
      "sortOrder": 2,
      "codingDetails": {
        "difficulty": "EASY",
        "timeLimitMs": 1000,
        "memoryLimitMb": 128,
        "constraintsText": "Inputs are integers between -1000 and 1000.",
        "inputFormat": "Two integers a and b.",
        "outputFormat": "Single integer sum.",
        "sampleInput": "2 3",
        "sampleOutput": "5",
        "notes": "Return the sum only.",
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
          },
          {
            "input": "-2 7",
            "expectedOutput": "5",
            "weight": 2,
            "visibility": "hidden"
          }
        ]
      }
    }
  ]
}
```

Save `data.id` as `{{assessmentId}}`.

## Add MCQ Question Example

MCQ questions require at least two unique options and exactly one correct option.

```json
{
  "type": "MCQ",
  "questionText": "Which collection prevents duplicates?",
  "marks": 5,
  "options": [
    { "optionText": "Set", "correct": true },
    { "optionText": "List", "correct": false }
  ]
}
```

## Add Multiple-Select Question Example

Multiple-select questions require at least two unique options and at least one correct option.

```json
{
  "type": "MULTIPLE_SELECT",
  "questionText": "Select valid HTTP methods.",
  "marks": 5,
  "options": [
    { "optionText": "GET", "correct": true },
    { "optionText": "POST", "correct": true },
    { "optionText": "FETCH", "correct": false }
  ]
}
```

## Add Coding Question Example

Coding questions can be saved as drafts with details, templates, and test cases. Publishing requires coding details, at least one template, and at least one test case.

```json
{
  "type": "CODING",
  "questionText": "Return the maximum of two integers.",
  "marks": 20,
  "codingDetails": {
    "difficulty": "EASY",
    "timeLimitMs": 1000,
    "memoryLimitMb": 128,
    "templates": [
      { "language": "java", "starterCode": "class Solution { int max(int a, int b) { return 0; } }" }
    ],
    "testCases": [
      { "input": "4 9", "expectedOutput": "9", "weight": 1, "visibility": "public" }
    ]
  }
}
```

## Publish Assessment

Teacher token required.

```http
PUT /api/v1/assessments/{{assessmentId}}/publish
Authorization: Bearer {{teacherToken}}
```

Publishing requires:

- At least one assigned batch
- At least one question
- Positive duration and marks
- Valid date range when `startAt` and `endAt` are provided
- MCQ/true-false/multiple-select options and correct answers
- Coding details, template, and test case for coding questions

## Duplicate Assessment

Teacher token required. The duplicate is created as `DRAFT` and copies assigned batches, questions, options, coding details, templates, and test cases.

```http
POST /api/v1/assessments/{{assessmentId}}/duplicate
Authorization: Bearer {{teacherToken}}
```

## Get Student Assigned Assessments

Student token required. Only published assessments assigned through the student's batch are returned.

```http
GET /api/v1/students/me/assessments
Authorization: Bearer {{studentToken}}
```

## Common Errors

- `401 Authentication required`: missing or invalid token.
- `403 Access denied`: role is not allowed for the endpoint.
- `401 Teachers can manage only their own assessments`: teacher tried to access another teacher's assessment.
- `401 Student can access only assigned published assessments`: student requested an unassigned or draft assessment.
- `400 Assessment must be assigned to at least one batch before publishing`.
- `400 Assessment must have at least one question before publishing`.
- `400 Assessment duration must be greater than zero before publishing`.
- `400 Assessment endAt cannot be before startAt`.
- `400 MCQ questions require exactly one correct option`.
- `400 MULTIPLE_SELECT questions require at least one correct option`.
- `400 CODING questions require at least one coding template before publishing`.
- `404 Batch not found`.
- `404 Assessment not found`.
