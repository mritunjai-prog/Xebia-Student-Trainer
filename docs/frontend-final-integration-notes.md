# Frontend Final Integration Notes

## Scope

Reduced Phase 4 connects the remaining frontend pages to the Spring Boot API at:

```text
http://localhost:8082/api/v1
```

Frontend-only changes were made. The backend and React design system were not modified.

## Files Changed

- `frontend/src/api/client.js`
- `frontend/src/context/LMSContext.jsx`
- `frontend/src/pages/Evaluation.jsx`
- `frontend/src/pages/TeacherDashboard.jsx`
- `frontend/src/pages/StudentDashboard.jsx`
- `frontend/src/pages/Reports.jsx`
- `frontend/src/pages/Leaderboard.jsx`
- `frontend/src/pages/Settings.jsx`

## APIs Connected

### Evaluation

- `GET /api/v1/submissions`
- `GET /api/v1/submissions/{id}/result`
- `PUT /api/v1/submissions/{id}/evaluation`

The evaluation page now loads the teacher-scoped submission queue from the backend. Selecting a row fetches the detailed result response, including answers, question text, correct-answer details where the backend allows them, marks, and remarks. Publishing evaluation sends:

```json
{
  "questionEvaluations": [
    {
      "questionId": "uuid",
      "marksAwarded": 5,
      "remarks": "Good answer"
    }
  ],
  "overallRemarks": "Overall feedback"
}
```

Already evaluated submissions are shown read-only and the publish action is disabled.

### Dashboards

- `GET /api/v1/dashboard/teacher`
- `GET /api/v1/dashboard/student`

Teacher dashboard maps backend totals, pending evaluations, active assessments, recent submissions, and submission trend data to the existing KPI and chart layout.

Student dashboard maps active/upcoming/completed counts, pending evaluations, rank, and recent scores to the existing cards. The assessment cards continue to use the already-integrated assigned assessment list so navigation keeps backend UUID routes.

### Reports

- `GET /api/v1/reports/overview`
- `GET /api/v1/reports/batches`
- `GET /api/v1/reports/students`

Reports now use backend overview metrics, batch comparison data, score distribution buckets, and student diagnostics. The batch and search filters are passed to the student diagnostics endpoint.

### Leaderboard

- `GET /api/v1/leaderboard`

Leaderboard rows are fetched from the role-scoped backend endpoint and mapped to the existing podium/table UI.

### Notifications

- `GET /api/v1/notifications`
- `PUT /api/v1/notifications/{id}/read`
- `PUT /api/v1/notifications/read-all`

Header notifications now load visible backend notifications through context. Mark-read actions optimistically update the UI, then synchronize with the backend.

### Settings

- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `PUT /api/v1/users/me/password`
- `PUT /api/v1/users/me/notification-settings`

Profile save sends name, email, phone, bio, and `avatarUrl`. Password save validates confirmation on the frontend before calling the backend. Notification preferences call the backend settings endpoint.

## Mappers Added

- Teacher dashboard response mapper
- Student dashboard response mapper
- Overview report mapper
- Batch report mapper
- Student report mapper
- Leaderboard row mapper
- Notification mapper
- Settings/profile request mapper

## Fallback Behavior

Dashboard, report, and leaderboard pages call backend endpoints first. Existing local calculations remain only as UI safety if the request fails or returns no rows.

## Remaining Placeholders

- Avatar upload remains metadata/Data URL only; no real file upload is wired.
- Notification creation UI is not implemented.
- Real coding execution remains backend-placeholder only.
- Admin, chat, messages, timetable, and attendance remain out of scope.

## Manual Test Checklist

1. Start backend manually with the dev profile on port `8082`.
2. Start the frontend.
3. Log in as teacher and open:
   - Dashboard
   - Manual Evaluation
   - Reports
   - Leaderboard
   - Settings
4. Verify teacher dashboard and report values load from backend.
5. Select a submitted assessment in Manual Evaluation, publish marks, and confirm success/error handling.
6. Open notifications and mark one/all as read.
7. Update profile metadata, password, and notification settings.
8. Log in as student and open:
   - Dashboard
   - Leaderboard
   - Settings
9. Confirm student dashboard counts, rank, and recent results load without crashing on empty data.

## Production TODOs

- Replace Data URL avatar metadata with real file storage when backend storage is implemented.
- Add per-user notification read state for shared role/batch notifications when backend supports it.
- Add frontend integration tests for dashboard/report/evaluation flows.
- Add request cancellation/debouncing for report search if the dataset grows.
