# Frontend Teacher Core Integration Notes

## Scope

Reduced Phase 2 connects teacher-facing core flows to the Spring Boot backend:

- Student list for teacher enrollment views
- Batch list/create/update/delete
- Batch detail by UUID
- Batch student enrollment replacement
- Assessment list/create/update/detail
- Assessment publish
- Assessment duplicate/delete

Student attempt pages, quiz submit/results, evaluation, dashboard metrics, reports, leaderboard, notifications, and settings remain local/mock until later phases.

## APIs Connected

| Area | Method | Endpoint |
| --- | --- | --- |
| Students | GET | `/api/v1/users?role=STUDENT` |
| Batches | GET | `/api/v1/batches` |
| Batches | POST | `/api/v1/batches` |
| Batches | GET | `/api/v1/batches/{id}` |
| Batches | PUT | `/api/v1/batches/{id}` |
| Batches | DELETE | `/api/v1/batches/{id}` |
| Enrollment | PUT | `/api/v1/batches/{id}/students` |
| Assessments | GET | `/api/v1/assessments` |
| Assessments | POST | `/api/v1/assessments` |
| Assessments | GET | `/api/v1/assessments/{id}` |
| Assessments | PUT | `/api/v1/assessments/{id}` |
| Assessments | DELETE | `/api/v1/assessments/{id}` |
| Assessments | PUT | `/api/v1/assessments/{id}/publish` |
| Assessments | POST | `/api/v1/assessments/{id}/duplicate` |

## Files Changed

- `frontend/src/api/client.js`
- `frontend/src/context/LMSContext.jsx`
- `frontend/src/pages/BatchManagement.jsx`
- `frontend/src/pages/BatchDetail.jsx`
- `frontend/src/pages/AssessmentBuilder.jsx`
- `frontend/src/pages/AssessmentDetail.jsx`
- `frontend/src/components/assessment-builder/EnterpriseBuilderLayout.jsx`

## API Helpers Added

`frontend/src/api/client.js` now exports:

- `userApi.listStudents()`
- `batchApi.list()`
- `batchApi.create(payload)`
- `batchApi.get(id)`
- `batchApi.update(id, payload)`
- `batchApi.remove(id)`
- `batchApi.updateStudents(id, studentIds)`
- `assessmentApi.list()`
- `assessmentApi.create(payload)`
- `assessmentApi.get(id)`
- `assessmentApi.update(id, payload)`
- `assessmentApi.remove(id)`
- `assessmentApi.publish(id)`
- `assessmentApi.duplicate(id)`

## Data Mappers

Frontend mappers normalize backend DTOs into the existing UI shape:

- Batch `studentIds` -> frontend `students`
- Batch `ACTIVE/INACTIVE` -> `active/inactive`
- Assessment `batchIds` -> frontend `batches`
- Assessment `DRAFT/PUBLISHED/CLOSED` -> `draft/published/closed`
- Question `questionText` -> `question` and `text`
- Question options `{ optionText, correct }` -> frontend option arrays and `correctAnswer`
- Coding details/templates/test cases are mapped both ways

Outgoing assessment payloads normalize frontend values to backend enums:

- Assessment type: `QUIZ`, `CODING`, `MIXED`
- Difficulty: `EASY`, `MEDIUM`, `HARD`
- Status: `DRAFT`, `PUBLISHED`, `CLOSED`
- Question types: `MCQ`, `TRUE_FALSE`, `MULTIPLE_SELECT`, `SHORT_ANSWER`, `PARAGRAPH`, `FILE_UPLOAD`, `CODING`

## UUID Route Changes

Batch navigation now uses backend UUIDs:

- Old pattern: `/batches/{batchName}`
- New pattern: `/batches/{batchId}`

`BatchDetail` fetches the selected batch with `GET /api/v1/batches/{id}`.

`AssessmentDetail` fetches the selected assessment with `GET /api/v1/assessments/{id}`.

## Manual Test Steps

1. Start the Spring Boot backend manually on port `8082` with the dev profile.
2. Start the frontend with `cd frontend` then `npm run dev`.
3. Login as teacher: `teacher@example.com` / `password123`.
4. Open Batch Management.
5. Confirm students and batches load from the backend.
6. Create a batch with name, course, icon, and status.
7. Open the batch detail page and confirm the route uses the UUID.
8. Enroll one or more students and save.
9. Edit batch name/course/status and confirm the detail page stays on the UUID route.
10. Create an assessment draft with at least one batch and one question.
11. Open the assessment detail page.
12. Publish the draft and confirm backend validation errors show if required data is missing.
13. Duplicate and delete assessments from the assessment list.

## Known Remaining Mock Areas

- Student assessment list and attempt flow
- Quiz/coding submission
- Evaluation queue and manual grading
- Results pages
- Teacher dashboard statistics
- Reports
- Leaderboard
- Notifications
- Settings/profile updates

## Next Phase

Next phase should connect the student core flow:

- Student assigned assessments
- Assessment start
- Draft save/get during attempts
- Final quiz submission
- Result retrieval
