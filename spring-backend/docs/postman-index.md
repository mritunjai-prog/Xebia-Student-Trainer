# Postman Collection Index

Use these collections with a Postman environment that defines:

```text
baseUrl=http://localhost:8081
teacherToken=
studentToken=
batchId=
studentId=
assessmentId=
questionId=
submissionId=
codingSubmissionId=
```

Run the backend manually with the `dev` profile when local H2 testing is needed:

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=8081"
```

Stop the server with `Ctrl+C` after testing.

## Recommended Testing Order

| Step | Collection | Purpose |
| --- | --- | --- |
| 1 | `postman-auth-user-batch.json` | Login, get current user, list students, create batch, enroll student |
| 2 | `postman-assessment.json` | Create assessment, assign batch, publish, duplicate, student assigned list |
| 3 | `postman-submission.json` | Start attempt, submit objective answers, get result, teacher list submissions |
| 4 | `postman-draft.json` | Save and retrieve assessment drafts |
| 5 | `postman-evaluation-result.json` | Teacher evaluates manual answers and reviews polished result response |
| 6 | `postman-coding-submission.json` | Validate placeholder coding run/submit/list flow |
| 7 | `postman-dashboard-report-notification.json` | Dashboard, reports, leaderboard, notifications |

## Available Collections

- `docs/postman-auth-user-batch.json`
- `docs/postman-assessment.json`
- `docs/postman-submission.json`
- `docs/postman-draft.json`
- `docs/postman-evaluation-result.json`
- `docs/postman-coding-submission.json`
- `docs/postman-dashboard-report-notification.json`

## Seed Users

Seed users are available only when the backend is started with the `dev` profile:

| Role | Email | Password |
| --- | --- | --- |
| Teacher | `teacher@example.com` | `password123` |
| Student | `student@example.com` | `password123` |

## Token Flow

1. Run the teacher login request.
2. Copy `data.accessToken` into `teacherToken`.
3. Run the student login request.
4. Copy `data.accessToken` into `studentToken`.
5. Use `Authorization: Bearer {{teacherToken}}` or `Authorization: Bearer {{studentToken}}`.

## ID Flow

- Use created batch response `data.id` as `batchId`.
- Use `GET /api/v1/users?role=STUDENT` response `data[0].id` as `studentId`.
- Use created assessment response `data.id` as `assessmentId`.
- Use assessment response question IDs as `questionId`.
- Use submission start response `data.id` as `submissionId`.
- Use coding submit response `data.id` as `codingSubmissionId`.

## Common Notes

- Every API response is wrapped in `success`, `message`, `data`, and `errors`.
- Use UUIDs exactly as returned by the backend.
- Coding run/submit is a safe placeholder and does not execute code.
- PostgreSQL credentials are placeholders; use `dev` profile for temporary local H2 testing.
