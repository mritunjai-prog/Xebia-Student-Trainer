# Dashboard, Reports, Leaderboard, and Notifications API Guide

This guide covers Phase 6 backend testing for dashboards, reports, leaderboard, and notifications.

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

## Teacher Dashboard

```http
GET /api/v1/dashboard/teacher
Authorization: Bearer {{teacherToken}}
```

Returns teacher-scoped totals for batches, assessments, students, submissions, pending evaluations, average score, recent submissions, active assessments, and submission trend data.

## Student Dashboard

```http
GET /api/v1/dashboard/student
Authorization: Bearer {{studentToken}}
```

Returns assigned active/upcoming assessments, completed submissions, pending evaluations, average score, best score, leaderboard rank, and recent results.

## Reports Overview

Teacher only.

```http
GET /api/v1/reports/overview
Authorization: Bearer {{teacherToken}}
```

Returns total assessments, total submissions, evaluated submissions, pending evaluations, average/highest/lowest score, pass rate, and score distribution buckets.

## Batch Reports

Teacher only.

```http
GET /api/v1/reports/batches
Authorization: Bearer {{teacherToken}}
```

Returns batch-wise student count, assigned assessment count, submission count, average score, and pass rate.

## Student Diagnostics

Teacher only.

```http
GET /api/v1/reports/students?batchId={{batchId}}&assessmentId={{assessmentId}}&search=student
Authorization: Bearer {{teacherToken}}
```

All filters are optional. Returns student ID/name/email, batch IDs/names, attempts count, completed/evaluated count, average score, highest score, and pending evaluations.

## Leaderboard

Accessible to teacher and student.

```http
GET /api/v1/leaderboard?batchId={{batchId}}&assessmentId={{assessmentId}}
Authorization: Bearer {{teacherToken}}
```

Students can also call:

```http
GET /api/v1/leaderboard
Authorization: Bearer {{studentToken}}
```

Teachers see leaderboard rows for their batches/assessments. Students see rows scoped to their own batches. Student callers receive email only for their own row; other student emails are hidden.

## Get Notifications

```http
GET /api/v1/notifications
Authorization: Bearer {{studentToken}}
```

Returns notifications visible to the current user by direct user target, role target, or batch target.

## Mark Notification Read

```http
PUT /api/v1/notifications/{{notificationId}}/read
Authorization: Bearer {{studentToken}}
```

Only visible notifications can be marked read.

## Mark All Read

```http
PUT /api/v1/notifications/read-all
Authorization: Bearer {{studentToken}}
```

Marks only notifications visible to the current user.

## Common Errors

- `401 Authentication required`: missing or invalid token.
- `403 Access denied`: role is not allowed for teacher/student-specific endpoint.
- `401 Teacher access required`: non-teacher called a teacher report/dashboard endpoint.
- `401 Student access required`: non-student called the student dashboard endpoint.
- `401 Cannot update a notification that is not visible to the current user`.
- `400 Invalid request parameter`: invalid UUID or enum query parameter.

## Notes

- Metrics are calculated from existing batches, assessments, submissions, and users.
- Empty datasets return zero values and empty lists.
- Notification read state is currently stored on the notification row. A future per-user notification-read table would be better for shared role or batch notifications.
