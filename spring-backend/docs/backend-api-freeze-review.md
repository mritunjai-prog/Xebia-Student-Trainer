# Backend API Freeze Review

Project: Xebia Student-Trainer Assessment Portal Backend  
Package root: `com.xebia.portal`  
Stack: Java 17, Spring Boot 3.3.x, Spring Security, Spring Data JPA, PostgreSQL placeholder profile, H2 dev profile

## Scope Reviewed

This freeze review covered the backend API surface needed before controlled frontend integration:

- Auth and JWT-style token flow
- Current user profile, password, notification settings
- Batch CRUD and student enrollment
- Assessment builder, batch assignment, publish, duplicate
- Questions, options, coding metadata, templates, test cases
- Student assigned assessments
- Submission start, final submit, auto-grading, draft save/get
- Manual evaluation and result response
- Coding run/submit/list placeholder flow
- Dashboard, reports, leaderboard
- Notifications
- File upload metadata placeholder
- CORS, security, exception handling, config, Maven dependencies

The React frontend was not modified.

## Freeze Decision

The backend is ready for controlled frontend integration against the documented API contracts, with the known placeholders listed below.

It is not production-ready yet because secure code execution, production JWT/refresh-token handling, real file storage, environment-managed PostgreSQL credentials, and integration tests are still TODO.

## Response Contract

All controllers reviewed return the shared wrapper:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "errors": []
}
```

Errors use:

```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": []
}
```

Validation failures, authentication failures, authorization failures, not-found errors, and data constraint errors are handled through `GlobalExceptionHandler` or Spring Security exception handlers.

## Authentication And Security

| Area | Status | Notes |
| --- | --- | --- |
| Login | Ready for dev/frontend testing | `POST /api/v1/auth/login` returns access and refresh tokens. |
| Refresh | Placeholder-ready | Refresh tokens are validated cryptographically but are not persisted or revoked server-side. |
| Logout | Placeholder-ready | Stateless success response. Real revocation requires refresh-token storage. |
| Password hashing | Ready | BCrypt is used. Dev seed passwords are encoded. |
| Protected routes | Ready | All routes except auth require authentication. Sensitive write routes use role checks. |
| Role model | Ready | `STUDENT` and `TEACHER` only. No admin module. |
| CORS | Dev-ready | Allows `http://localhost:3000` and `http://localhost:5173`. |

Frontend must send:

```http
Authorization: Bearer {{accessToken}}
```

## API Inventory

| Module | Endpoint | Access | Status |
| --- | --- | --- | --- |
| Auth | `POST /api/v1/auth/login` | Public | Ready |
| Auth | `POST /api/v1/auth/refresh` | Public | Placeholder refresh persistence |
| Auth | `POST /api/v1/auth/logout` | Public | Stateless placeholder |
| User | `GET /api/v1/users/me` | Authenticated | Ready |
| User | `PUT /api/v1/users/me` | Authenticated | Ready |
| User | `PUT /api/v1/users/me/password` | Authenticated | Ready |
| User | `PUT /api/v1/users/me/notification-settings` | Authenticated | Ready |
| User | `GET /api/v1/users?role=STUDENT` | Teacher | Ready |
| Batch | `GET /api/v1/batches` | Teacher | Ready |
| Batch | `POST /api/v1/batches` | Teacher | Ready |
| Batch | `GET /api/v1/batches/{id}` | Teacher | Ready |
| Batch | `PUT /api/v1/batches/{id}` | Teacher | Ready |
| Batch | `DELETE /api/v1/batches/{id}` | Teacher | Ready |
| Batch | `PUT /api/v1/batches/{id}/students` | Teacher | Ready |
| Assessment | `GET /api/v1/assessments` | Teacher | Ready |
| Assessment | `POST /api/v1/assessments` | Teacher | Ready |
| Assessment | `GET /api/v1/assessments/{id}` | Teacher owner or assigned student | Ready |
| Assessment | `PUT /api/v1/assessments/{id}` | Teacher owner | Ready |
| Assessment | `DELETE /api/v1/assessments/{id}` | Teacher owner | Ready |
| Assessment | `PUT /api/v1/assessments/{id}/publish` | Teacher owner | Ready |
| Assessment | `POST /api/v1/assessments/{id}/duplicate` | Teacher owner | Ready |
| Assessment | `GET /api/v1/students/me/assessments` | Student | Ready |
| Draft | `POST /api/v1/assessments/drafts/{studentId}/{assessmentId}` | Student owner | Ready |
| Draft | `GET /api/v1/assessments/drafts/{studentId}/{assessmentId}` | Student owner | Ready |
| Submission | `POST /api/v1/submissions/start` | Student | Ready |
| Submission | `POST /api/v1/submissions/{id}/submit` | Student owner | Ready |
| Submission | `GET /api/v1/submissions` | Student owner or teacher-owned assessments | Ready |
| Submission | `GET /api/v1/submissions/{id}/result` | Student owner or teacher owner | Ready |
| Submission | `PUT /api/v1/submissions/{id}/evaluation` | Teacher owner | Ready |
| Coding | `POST /api/v1/coding-submissions/run` | Student | Placeholder execution |
| Coding | `POST /api/v1/coding-submissions` | Student | Placeholder scoring |
| Coding | `GET /api/v1/coding-submissions` | Student owner or teacher owner | Ready |
| Dashboard | `GET /api/v1/dashboard/teacher` | Teacher | Ready for dev |
| Dashboard | `GET /api/v1/dashboard/student` | Student | Ready for dev |
| Reports | `GET /api/v1/reports/overview` | Teacher | Ready for dev |
| Reports | `GET /api/v1/reports/batches` | Teacher | Ready for dev |
| Reports | `GET /api/v1/reports/students` | Teacher | Ready for dev |
| Leaderboard | `GET /api/v1/leaderboard` | Authenticated, scoped by role | Ready for dev |
| Notifications | `GET /api/v1/notifications` | Authenticated, scoped visibility | Ready |
| Notifications | `PUT /api/v1/notifications/{id}/read` | Visible recipient | Ready with limitation |
| Notifications | `PUT /api/v1/notifications/read-all` | Visible recipient | Ready with limitation |
| Files | `POST /api/v1/files/upload` | Authenticated | Metadata placeholder |

## Ownership And Authorization Checks

- Teachers can manage only their own batches and assessments.
- Teachers can list and evaluate submissions only for assessments they created.
- Students can start only assigned, published, currently available assessments.
- Students can submit only their own started submissions.
- Students can access only their own drafts, results, and coding submissions.
- Assessment read access is teacher-owner or assigned published student.
- Coding run/submit validates assigned batch, published assessment, assessment type, question type, language, and code.
- Notification list and read actions check visibility by user, role, or batch.

## DTO And Serialization Review

- Controllers return DTOs and `ApiResponse`, not raw JPA entities.
- Mapper methods flatten relationships into IDs/summaries to avoid circular JSON.
- JPA lazy loading is handled inside transactional service methods before DTO mapping.
- Result responses include assessment summary, student summary, score, percentage, status, timestamps, remarks, and answer-level details.
- Correct answer details are hidden from students until evaluation is complete.

## PostgreSQL And Profile Review

`application-postgres.properties` contains placeholder values only:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/xebia_portal
spring.datasource.username=your_username
spring.datasource.password=your_password
```

`application-dev.properties` uses H2 in-memory database for temporary local API testing only.

`DataSeeder` runs only with profile `dev` and creates:

- `teacher@example.com` / `password123` / `TEACHER`
- `student@example.com` / `password123` / `STUDENT`

## Frontend Integration Notes

- Replace fake frontend auth/localStorage users with `POST /api/v1/auth/login`.
- Store and send `accessToken` as a Bearer token.
- Expect all API responses under `data`, not as raw objects.
- Use UUIDs from backend responses for `batchId`, `studentId`, `assessmentId`, `questionId`, and `submissionId`.
- Dates should be sent as ISO-8601 timestamps.
- For question creation, option-based questions must send at least two options and valid `correct` flags.
- Coding run is intentionally a placeholder and should be shown as validation/dummy execution until sandbox work is added.
- File upload currently returns placeholder metadata and not a real downloadable object URL.
- Notification read state is currently stored on the notification row, not per recipient.

## Known Limitations

- JWT implementation is a local HMAC token provider, not a full production JWT library.
- Refresh token persistence/revocation is not implemented.
- Logout is stateless.
- Real secure code execution sandbox is not implemented.
- Coding scores are placeholders.
- File storage is metadata-only.
- Analytics/report calculations are service-level calculations and should move to optimized queries for scale.
- Notification read status is not per-user for shared role/batch notifications.
- Automated integration/controller tests are still needed.

## Freeze Checklist

- [x] Backend scoped to Spring Boot project only
- [x] PostgreSQL credentials remain placeholders
- [x] H2 available only through `dev` profile
- [x] Auth/User/Batch APIs documented
- [x] Assessment APIs documented
- [x] Submission APIs documented
- [x] Draft APIs documented
- [x] Evaluation/result APIs documented
- [x] Coding placeholder APIs documented
- [x] Dashboard/report/leaderboard/notification APIs documented
- [x] Postman collections created per module
- [x] Controllers return wrapped DTO responses
- [x] Role/ownership checks reviewed
- [x] JPA circular JSON avoided through DTO mapping

## Verification Command

Run from `spring-backend`:

```bash
mvn -q -DskipTests package
```

Do not use `spring-boot:run` for automated freeze verification because it starts a long-running server process by design.
