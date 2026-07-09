# Xebia Student-Trainer Assessment Portal Backend

Spring Boot backend scaffold for the Xebia Student-Trainer Assessment Portal. The API is designed for an assessment-focused LMS frontend with student and trainer login, batches, enrollment, assessment builder, quiz/coding assessments, submissions, manual evaluation, reports, leaderboard, notifications, file metadata, and settings.

## Tech Stack

- Java 17
- Spring Boot 3.3.x
- Spring Web
- Spring Security with stateless JWT-style tokens
- Spring Data JPA
- PostgreSQL driver
- Bean Validation
- Lombok

## Folder Structure

```text
src/main/java/com/xebia/portal/
  config/          CORS and development-only seed data
  controller/      REST API controllers
  dto/request/     Request DTO records and validation
  dto/response/    Response DTO records and ApiResponse wrapper
  entity/          JPA entities and enums
  repository/      Spring Data JPA repositories
  service/         Service interfaces
  service/impl/    Service implementations
  security/        Security config, JWT provider, auth filter
  exception/       Custom exceptions and global error handling
  mapper/          Entity-to-DTO mapping
```

## Response Format

Successful responses use:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "errors": []
}
```

Error responses use:

```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": []
}
```

## Main API Groups

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `/api/v1/users/me`
- `/api/v1/users`
- `/api/v1/batches`
- `/api/v1/assessments`
- `/api/v1/students/me/assessments`
- `/api/v1/submissions`
- `/api/v1/coding-submissions`
- `/api/v1/dashboard/teacher`
- `/api/v1/dashboard/student`
- `/api/v1/reports/*`
- `/api/v1/leaderboard`
- `/api/v1/notifications`
- `/api/v1/files/upload`

## API Documentation

Detailed module docs and Postman examples are in `docs/`:

- `docs/auth-user-batch-api.md`
- `docs/assessment-api.md`
- `docs/submission-api.md`
- `docs/draft-api.md`
- `docs/evaluation-result-api.md`
- `docs/coding-submission-api.md`
- `docs/dashboard-report-leaderboard-notification-api.md`
- `docs/backend-api-freeze-review.md`
- `docs/postman-index.md`

## Compile

From `spring-backend`:

```bash
mvn -q -DskipTests package
```

## PostgreSQL Configuration

PostgreSQL settings are placeholders in:

```text
src/main/resources/application-postgres.properties
```

Replace these values later in a local-only or environment-managed configuration:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/xebia_portal
spring.datasource.username=your_username
spring.datasource.password=your_password
```

Do not commit real database credentials.

## Profiles

- Default active profile: `postgres`
- Local API testing profile: `dev` with in-memory H2
- Development seed data runs only when `dev` is active

To run temporary local API tests on Windows PowerShell:

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=8081"
```

To run later with PostgreSQL and seed demo users after real PostgreSQL credentials are configured:

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=postgres,dev"
```

Seed users are only created when `dev` is active:

- Teacher: `teacher@example.com` / `password123` / `TEACHER`
- Student: `student@example.com` / `password123` / `STUDENT`

Passwords are BCrypt encoded before saving.

## Implemented

- DTO-based controllers with consistent response wrapper
- Global validation and exception response handling
- Stateless Spring Security configuration
- Placeholder JWT-style auth service
- Student/teacher roles
- Batches and enrollment
- Assessment builder with quiz and coding question metadata
- Student assessment listing
- Submission start/submit/result/evaluation flow
- Coding submission placeholder flow
- Dashboard/report/leaderboard placeholder calculations
- Notification read flow
- File metadata placeholder upload

## Frontend Integration Readiness

The backend API is ready for controlled React integration against the documented contracts. Frontend integration should use Bearer tokens from the login response, UUIDs returned by backend DTOs, and the shared `ApiResponse` wrapper.

Known placeholders remain for production JWT refresh-token persistence, secure code execution, real file storage, and deeper analytics queries.

## TODO

- Replace placeholder JWT internals with a production-grade signed JWT library and refresh-token persistence.
- Add real PostgreSQL credentials through environment variables or local secret management.
- Build a real secure code execution sandbox outside the API process.
- Implement real file/object storage.
- Deepen analytics and report calculations.
- Add integration tests and controller tests.
- Connect the React frontend only after backend APIs are finalized.
