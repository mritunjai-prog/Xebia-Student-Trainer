# Frontend Student Core Integration Notes

## Scope

Reduced Phase 3 connects the student attempt flow to the Spring Boot backend:

- Student assigned assessments
- Quiz/coding attempt start
- Draft save/get
- Quiz final submit
- Result page
- Coding run placeholder
- Coding submit placeholder

Dashboard metrics, reports, leaderboard, notifications, settings, and teacher evaluation remain unconnected.

## Files Changed

- `frontend/src/api/client.js`
- `frontend/src/context/LMSContext.jsx`
- `frontend/src/pages/StudentAssessments.jsx`
- `frontend/src/pages/TakeQuiz.jsx`
- `frontend/src/pages/TakeCoding.jsx`
- `frontend/src/pages/Results.jsx`
- `frontend/src/pages/StudentDashboard.jsx`

## APIs Connected

| Area | Method | Endpoint |
| --- | --- | --- |
| Assigned assessments | GET | `/api/v1/students/me/assessments` |
| Start attempt | POST | `/api/v1/submissions/start` |
| Submit attempt | POST | `/api/v1/submissions/{id}/submit` |
| Result | GET | `/api/v1/submissions/{id}/result` |
| Submission list | GET | `/api/v1/submissions` |
| Save draft | POST | `/api/v1/assessments/drafts/{studentId}/{assessmentId}` |
| Get draft | GET | `/api/v1/assessments/drafts/{studentId}/{assessmentId}` |
| Run code | POST | `/api/v1/coding-submissions/run` |
| Submit code | POST | `/api/v1/coding-submissions` |
| Coding list | GET | `/api/v1/coding-submissions` |

## Mappers Added

`frontend/src/api/client.js` now maps:

- Backend submissions `STARTED/SUBMITTED/EVALUATED` to frontend `in_progress/submitted/evaluated`
- Backend answer `answerText` and `answerJson` to one frontend `answer` value
- Frontend answer values back to `answerText` or `answerJson`
- Backend `SubmissionResultResponse` into result-page friendly fields

## Route And UUID Notes

Student assessment cards now navigate with backend UUIDs:

- Quiz route: `/take/{assessmentId}`
- Coding route: `/take-coding/{assessmentId}`

The existing route param is still named `:slug` in `App.jsx`, but student attempt pages treat it as `assessmentId`.

The existing result route remains:

- `/results/:slug/:id`

`Results.jsx` treats `:id` as the backend `submissionId` and ignores the slug.

## Draft Behavior

`TakeQuiz.jsx` loads a draft with:

```json
{
  "answers": {},
  "currentQuestion": 0,
  "timeRemaining": 1200
}
```

Drafts autosave after answer/current-question/time changes. Drafts are not saved after final submission.

`TakeCoding.jsx` also saves a draft-like payload for coding progress:

```json
{
  "currentQuestion": 0,
  "timeRemaining": 1200,
  "submittedCodes": {}
}
```

## Quiz Submit Behavior

Quiz answers are submitted to:

`POST /api/v1/submissions/{id}/submit`

Text answers are sent as `answerText`; arrays/objects are sent as `answerJson`.

After successful submit, the frontend routes to:

`/results/{assessmentId}/{submissionId}`

## Coding Placeholder Behavior

`TakeCoding.jsx` calls the backend placeholder APIs:

- Run: `POST /api/v1/coding-submissions/run`
- Submit: `POST /api/v1/coding-submissions`

The UI clearly treats this as placeholder execution. It does not expect real sandboxed code execution.

Finalizing a coding assessment submits coding answers into the normal submission flow so the result page can load with the backend submission ID.

## Manual Test Steps

1. Start Spring Boot manually on port `8082`.
2. Run the frontend with `cd frontend` then `npm run dev`.
3. Login as `student@example.com` / `password123`.
4. Open `/assessments`.
5. Confirm assigned published assessments load.
6. Start a quiz assessment using the card/button.
7. Answer questions and refresh the page to verify draft restore.
8. Submit the quiz and confirm navigation to the result page.
9. Start a coding assessment.
10. Run code and confirm the backend placeholder message appears.
11. Submit code and finalize the coding assessment.
12. Open the result page and confirm answer review renders.

## Known Remaining Mock Areas

- Student dashboard statistics
- Teacher evaluation queue
- Reports
- Leaderboard
- Notifications
- Settings/profile update flows
- Real file upload
- Real secure code execution sandbox

## Next Phase

Next phase should connect:

- Manual evaluation UI
- Dashboard summary APIs
- Reports
- Leaderboard
- Notifications
- Settings/profile APIs
