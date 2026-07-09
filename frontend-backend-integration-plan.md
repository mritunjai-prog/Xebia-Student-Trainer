# Frontend-Backend Integration Plan

Project root: `D:\projects\Xebia-Student-Trainer-main`  
Frontend: React + Vite  
Backend dev base URL: `http://localhost:8082/api/v1`  
Backend response wrapper:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "errors": []
}
```

Backend auth header:

```http
Authorization: Bearer <accessToken>
```

This document is an integration plan only. No frontend code, backend code, or server process was changed or run.

## Integration Overview

The React app is an assessment-focused LMS portal with two visible roles:

- `teacher` in the frontend, corresponding to backend `TEACHER`
- `student` in the frontend, corresponding to backend `STUDENT`

The frontend currently stores most domain state in `LMSContext.jsx` and mirrors it into `localStorage`. It has a partial `frontend/src/api/client.js`, but that client is not ready for the frozen Spring Boot backend because it:

- Uses relative base URL `/api/v1` instead of the requested dev URL or a Vite environment variable.
- Does not attach `Authorization: Bearer <accessToken>`.
- Does not unwrap backend `ApiResponse.data`.
- Does not handle `success: false` or `errors`.
- Does not centralize `401` logout behavior.
- Uses old/nonexistent submission endpoints such as `POST /api/v1/submissions`.
- Sends frontend-shaped payloads rather than backend DTO-shaped payloads.

Recommended integration approach: replace one vertical flow at a time, starting with API client and auth. Do not try to convert all pages at once; the data shape differences are large enough that a phased adapter/mapping layer is safer.

## Current Frontend Flow

1. `App.jsx` wraps the app in `LMSProvider`.
2. If `currentUser` is missing, `AppContent` renders `Login` directly instead of using a routed `/login` page.
3. If logged in, routes are chosen based on `currentUser.role === 'teacher'`.
4. Most pages consume arrays and helper methods from `useLMS()`.
5. `LMSContext.jsx` currently fetches some backend-like data on mount, but still uses fake auth, frontend-side calculations, localStorage mirrors, and old API shapes.
6. `Header.jsx` and `Sidebar.jsx` call `logout()` and navigate to `/login`, but `/login` is not explicitly registered in the logged-in route tree.

## Auth Flow Analysis

| File | Current behavior | Backend replacement | Later changes needed |
| --- | --- | --- | --- |
| `frontend/src/pages/Login.jsx` | Email + role only. No password. Quick access uses loaded teacher/student arrays. | `POST /api/v1/auth/login` with `email`, `password`, `role`. | Add password field, use seeded demo credentials, call API client login, store tokens, route by backend user role. |
| `frontend/src/context/LMSContext.jsx` | `login(email, role)` searches local `teachers` or `students`; stores full user in `localStorage.session`. | Login response tokens + `GET /api/v1/users/me`. | Replace fake login with token auth, store minimal auth state, load current user from backend. |
| `frontend/src/App.jsx` | No explicit public `/login` route; renders login whenever `currentUser` is null. | Protected route guard with explicit `/login`. | Add proper `RequireAuth`/role guard later. |
| `frontend/src/components/Header.jsx` | Filters local notifications and calls local `logout()`. Navigates to `/login`. | `POST /api/v1/auth/logout`, clear tokens, redirect. Notifications from `/api/v1/notifications`. | Use API logout and backend notifications. |
| `frontend/src/components/Sidebar.jsx` | Role checks use lowercase `teacher`/`student`; logout is local. | Backend roles are uppercase. | Normalize roles in adapter or update UI checks. |
| `localStorage` | Stores `session`, data arrays, coding drafts, theme. | Tokens plus limited UI preferences only. | Stop storing domain data as source of truth. |

### What Is Fake Right Now

- Login does not verify a password.
- Role is selected by the user, not trusted from backend auth.
- `currentUser` is a local object, not backend-authenticated identity.
- Logout only clears local `currentUser`.
- Quick login depends on preloaded users instead of seeded backend accounts.

### Backend Auth APIs

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`

Seed users for dev profile:

- Teacher: `teacher@example.com` / `password123` / `TEACHER`
- Student: `student@example.com` / `password123` / `STUDENT`

## API Client Plan

Current file: `frontend/src/api/client.js`

Later implementation should use Vite env:

```text
VITE_API_BASE_URL=http://localhost:8082/api/v1
```

Recommended client behavior:

- Default base URL from `import.meta.env.VITE_API_BASE_URL`.
- Fallback to `http://localhost:8082/api/v1` for dev only.
- Store `accessToken` and `refreshToken` separately from `currentUser`.
- Attach `Authorization: Bearer ${accessToken}` for protected requests.
- Accept `GET`, `POST`, `PUT`, `DELETE`.
- For JSON requests, set `Content-Type: application/json`.
- For multipart upload, omit `Content-Type` and let the browser set the boundary.
- Parse backend wrapper, return only `body.data` for success.
- If `success === false`, throw an error using `message` and `errors`.
- On HTTP `401`, clear auth state and redirect to login.
- Keep DTO mappers separate from raw request methods.

Example conceptual methods to add later:

- `auth.login({ email, password, role })`
- `auth.refresh(refreshToken)`
- `auth.logout(refreshToken)`
- `users.me()`
- `users.updateMe(payload)`
- `users.updatePassword(payload)`
- `users.updateNotificationSettings(payload)`
- `users.list({ role })`
- `batches.list/create/get/update/delete/enrollStudents`
- `assessments.list/create/get/update/delete/publish/duplicate/studentAssigned`
- `drafts.save/get`
- `submissions.start/submit/list/result/evaluate`
- `coding.run/submit/list`
- `dashboard.teacher/student`
- `reports.overview/batches/students`
- `leaderboard.list`
- `notifications.list/markRead/markAllRead`
- `files.upload`

## Mock And LocalStorage Replacement Map

| File path | Current fake/mock behavior | Backend API replacement | Data shape mismatch risk |
| --- | --- | --- | --- |
| `frontend/src/context/LMSContext.jsx` | Central local state for teachers, students, batches, assessments, submissions, notifications, coding submissions, leaderboard. Writes most state into localStorage. | Multiple APIs across auth, users, batches, assessments, submissions, coding, notifications, leaderboard. | High: frontend objects use lowercase enum strings, `batches`, `students`, `answer`, `isEvaluated`; backend uses UUID DTOs, uppercase enums, `batchIds`, `studentIds`, `answerText/answerJson`. |
| `frontend/src/context/LMSContext.jsx` | Fake login searches local users by email and role. | `POST /api/v1/auth/login`, `GET /api/v1/users/me`. | High: password required; backend role uppercase. |
| `frontend/src/context/LMSContext.jsx` | Creates notifications locally via `addNotification`. | `GET /api/v1/notifications`, `PUT /api/v1/notifications/{id}/read`, `PUT /api/v1/notifications/read-all`. | Medium: backend notification read state is shared for role/batch notifications. |
| `frontend/src/context/LMSContext.jsx` | `getLeaderboard()` calculates points from local students/submissions. | `GET /api/v1/leaderboard`. | Medium: backend response uses `totalScore`, `averageScore`, `bestScore`, `batchNames`; UI expects `score`, `average`, `avatar`. |
| `frontend/src/context/LMSContext.jsx` | `startAssessment()` creates local `in_progress` submission and calls old `apiClient.createSubmission`. | `POST /api/v1/submissions/start`. | High: backend status is `STARTED`; old endpoint does not exist. |
| `frontend/src/context/LMSContext.jsx` | `submitAssessment()` calculates objective marks in browser and calls old create submission. | `POST /api/v1/submissions/{id}/submit`. | High: backend auto-grades and expects `answerText`/`answerJson`. |
| `frontend/src/context/LMSContext.jsx` | `evaluateSubmission()` updates local marks and remarks. | `PUT /api/v1/submissions/{id}/evaluation`. | Medium: backend blocks re-evaluation and validates marks per question. |
| `frontend/src/context/LMSContext.jsx` | Coding submissions and coding leaderboard are localStorage only. | `POST /api/v1/coding-submissions/run`, `POST /api/v1/coding-submissions`, `GET /api/v1/coding-submissions`. | High: backend placeholder returns different run/result DTOs. |
| `frontend/src/pages/TakeCoding.jsx` | Saves code drafts in localStorage keys like `draft_code_${assessmentId}_${questionId}_${language}`. | `POST/GET /api/v1/assessments/drafts/{studentId}/{assessmentId}`. | Medium: backend draft is assessment-level JSON, not per-language localStorage key. |
| `frontend/src/pages/TakeQuiz.jsx` | Simulates file upload with timeout and stores file metadata in answer object. | `POST /api/v1/files/upload`, then submit returned metadata/URL in answer JSON. | Medium: backend file upload is metadata placeholder. |
| `frontend/src/pages/TeacherDashboard.jsx` | Computes dashboard values from local arrays and dummy date buckets. | `GET /api/v1/dashboard/teacher`. | Medium: backend provides summarized DTOs; chart mapping needed. |
| `frontend/src/pages/StudentDashboard.jsx` | Computes assigned/active/completed assessments and rank from local arrays. | `GET /api/v1/dashboard/student`, `GET /api/v1/students/me/assessments`, `GET /api/v1/leaderboard`. | Medium. |
| `frontend/src/pages/Reports.jsx` | Computes reports and fallback values from local arrays. | `GET /api/v1/reports/overview`, `/reports/batches`, `/reports/students`. | Medium: charts need response mapping. |
| `frontend/src/pages/Settings.jsx` | Profile/password/notification changes only update local state or show toast. | `PUT /api/v1/users/me`, `/me/password`, `/me/notification-settings`. | Low-medium: backend field names differ for `avatarUrl` vs `avatar`. |
| `frontend/src/utils/aiService.js` | Calls Groq directly from frontend and falls back to dummy description/questions/evaluation. | No matching frozen backend AI generation endpoint. | High if kept in backend-connected flow; should remain optional frontend-only or be deferred. |
| `frontend/.env.example` | Mentions Gemini/API Studio variables, not current Vite backend base URL or Groq key used by code. | Add `VITE_API_BASE_URL` later. | Low but confusing. |

## Page-By-Page API Mapping

| Page/component | Current frontend data source | Backend APIs needed | Files to edit later | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| Login | `useLMS().login`, `teachers`, `students`; email + role only | `POST /api/v1/auth/login`, `GET /api/v1/users/me` | `frontend/src/pages/Login.jsx`, `frontend/src/context/LMSContext.jsx`, `frontend/src/api/client.js`, `frontend/src/App.jsx` | High | Must add password, token storage, explicit login route. |
| Teacher dashboard | Local `students`, `batches`, `assessments`, `submissions`, `notifications` | `GET /api/v1/dashboard/teacher`, maybe `/notifications` | `frontend/src/pages/TeacherDashboard.jsx`, `frontend/src/context/LMSContext.jsx` | Medium | Replace local chart calculations with backend summaries. |
| Student dashboard | Local assessments/submissions/leaderboard | `GET /api/v1/dashboard/student`, `GET /api/v1/students/me/assessments`, `GET /api/v1/leaderboard` | `frontend/src/pages/StudentDashboard.jsx` | Medium | Current logic depends on `currentUser.batches`. |
| Batch management | Local batches/students and context CRUD helpers | `GET/POST/PUT/DELETE /api/v1/batches`, `GET /api/v1/users?role=STUDENT`, `PUT /api/v1/batches/{id}/students` | `frontend/src/pages/BatchManagement.jsx`, `frontend/src/context/LMSContext.jsx`, `frontend/src/api/client.js` | Medium | Enrollment should call separate backend endpoint. |
| Batch detail | Looks up batch by URL name; local students/assessments | `GET /api/v1/batches/{id}`, list students, list assessments | `frontend/src/pages/BatchDetail.jsx`, `frontend/src/App.jsx` | High | Route currently uses batch name, backend uses UUID. |
| Assessment builder | Local builder state + context create/edit/delete/publish/duplicate | `GET/POST/PUT/DELETE /api/v1/assessments`, `PUT /publish`, `POST /duplicate` | `frontend/src/pages/AssessmentBuilder.jsx`, `frontend/src/components/assessment-builder/*`, `frontend/src/context/LMSContext.jsx` | High | Needs DTO mapper for enums, dates, questions, options, coding details. |
| Assessment detail | Local `assessments`, `batches`; route uses assessment UUID | `GET /api/v1/assessments/{id}` | `frontend/src/pages/AssessmentDetail.jsx` | Medium | Details currently show correct answers; for students backend may hide/guard. |
| Student assessments | Local assigned assessment filtering by `currentUser.batches` | `GET /api/v1/students/me/assessments`, `GET /api/v1/submissions` | `frontend/src/pages/StudentAssessments.jsx` | Medium | Backend already scopes assigned assessments. |
| Take quiz | Local assessment by slug, local submission start/submit, local file mock | `GET /api/v1/assessments/{id}`, `POST /submissions/start`, `POST /submissions/{id}/submit`, draft APIs, optional file upload | `frontend/src/pages/TakeQuiz.jsx`, routes, context/client | High | Route by slug is fragile; needs assessment ID. |
| Take coding | Local assessment by slug, localStorage code drafts, Groq AI execution, local coding submissions | `POST /api/v1/coding-submissions/run`, `POST /api/v1/coding-submissions`, `GET /api/v1/coding-submissions`, submission start/submit, draft APIs | `frontend/src/pages/TakeCoding.jsx`, context/client | High | Backend run is safe placeholder; do not call Groq as source of grading if backend flow is active. |
| Results page | Local submission/assessment/student arrays | `GET /api/v1/submissions/{id}/result` | `frontend/src/pages/Results.jsx` | Medium | Backend result response is richer and differently nested. |
| Evaluation page | Local submitted submissions + AI service + context evaluation | `GET /api/v1/submissions`, `GET /api/v1/submissions/{id}/result`, `PUT /api/v1/submissions/{id}/evaluation` | `frontend/src/pages/Evaluation.jsx`, `frontend/src/utils/aiService.js` | Medium | Backend evaluation is teacher-only and validates marks/status. |
| Reports page | Local computed chart values with fallback numbers | `GET /api/v1/reports/overview`, `/reports/batches`, `/reports/students` | `frontend/src/pages/Reports.jsx` | Medium | Chart adapters needed. |
| Leaderboard page | `getLeaderboard()` local calculation | `GET /api/v1/leaderboard` | `frontend/src/pages/Leaderboard.jsx`, context/client | Low-medium | Backend field names differ. |
| Header/notifications | Local `notifications` filtered in UI | `GET /api/v1/notifications`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all` | `frontend/src/components/Header.jsx`, context/client | Medium | Backend visibility is server-side; read state limitation exists. |
| Settings page | Local profile update, password toast only, notification toggles local | `PUT /api/v1/users/me`, `/me/password`, `/me/notification-settings`, optional `POST /files/upload` | `frontend/src/pages/Settings.jsx`, context/client | Low-medium | Avatar upload should use file API later; backend returns `avatarUrl`. |

## Backend/Frontend Mismatch List

- Backend uses UUIDs; `BatchDetail.jsx` currently routes by batch name.
- `TakeQuiz.jsx` and `TakeCoding.jsx` route by title slug; backend reads by UUID.
- Backend requires `email`, `password`, and role for login; frontend fake login uses only `email` and selected role.
- Backend roles/enums are uppercase (`TEACHER`, `STUDENT`, `PUBLISHED`, `STARTED`, `EVALUATED`); frontend uses lowercase (`teacher`, `student`, `published`, `in_progress`, `submitted`).
- Backend response is wrapped in `{ success, message, data, errors }`; frontend expects raw arrays/objects.
- Backend requires `Authorization: Bearer <accessToken>`; current client sends no auth header.
- Backend batch response uses `studentIds`; frontend expects `students`.
- Backend assessment request uses `batchIds`; frontend sends `batches`.
- Backend assessment dates use ISO timestamps `startAt`/`endAt`; frontend uses `startDate`, `startTime`, `endDate`, `endTime`.
- Backend question types likely use `MCQ`, `TRUE_FALSE`, `MULTIPLE_SELECT`, `SHORT_ANSWER`, `PARAGRAPH`, `FILE_UPLOAD`, `CODING`; frontend uses lowercase and sometimes both `multi_select` and `multiple_select`.
- Backend options are objects with `optionText` and `correct`; frontend often stores options as strings and correct answer as an index or array of indexes.
- Backend submission answer DTO uses `answerText` and `answerJson`; frontend uses `answer`.
- Backend starts attempts with `POST /submissions/start`; current client has old `POST /submissions`.
- Backend draft API expects `{ "draftData": {} }`; current client sends draft object directly.
- Backend coding execution is placeholder only; frontend currently uses Groq AI to simulate execution and grading.
- Backend notification read state is not fully per-user for shared role/batch notifications.
- Some dashboard/report frontend structures need mapping to backend response DTOs.
- Backend H2 dev profile is only for local testing.

## Reduced 4-Phase Integration Plan

### Phase 1: API Client, Auth, Current User, Logout

Files to modify later:

- `frontend/src/api/client.js`
- `frontend/src/context/LMSContext.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/App.jsx`
- `frontend/src/components/Header.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/.env.example`

APIs used:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`

Implementation notes:

- Add `VITE_API_BASE_URL=http://localhost:8082/api/v1`.
- Add password input and seeded quick-login buttons.
- Store `accessToken`, `refreshToken`, and minimal user state.
- Normalize backend roles to frontend roles or update role checks to uppercase.
- Add explicit `/login` route and role-aware protected routes.
- Remove eager backend data fetching before login.

Testing checklist:

- Login teacher with `teacher@example.com/password123`.
- Login student with `student@example.com/password123`.
- Refresh page and keep session via stored token.
- Logout clears tokens and returns to login.
- Protected URLs redirect to login when token is missing.
- A bad password shows backend error message.

Likely breaking points:

- Existing quick access expects `teachers`/`students` before login.
- `Header`/`Sidebar` navigate to `/login`, but route is not explicit yet.
- Role string casing will break route selection if not normalized.

### Phase 2: Teacher Core Flow

Files to modify later:

- `frontend/src/api/client.js`
- `frontend/src/context/LMSContext.jsx`
- `frontend/src/pages/BatchManagement.jsx`
- `frontend/src/pages/BatchDetail.jsx`
- `frontend/src/pages/AssessmentBuilder.jsx`
- `frontend/src/pages/AssessmentDetail.jsx`
- `frontend/src/components/assessment-builder/EnterpriseBuilderLayout.jsx`
- `frontend/src/components/assessment-builder/ConfigPanel.jsx`
- `frontend/src/components/assessment-builder/QuestionBuilderPanel.jsx`

APIs used:

- `GET /api/v1/users?role=STUDENT`
- `GET /api/v1/batches`
- `POST /api/v1/batches`
- `GET /api/v1/batches/{id}`
- `PUT /api/v1/batches/{id}`
- `DELETE /api/v1/batches/{id}`
- `PUT /api/v1/batches/{id}/students`
- `GET /api/v1/assessments`
- `POST /api/v1/assessments`
- `GET /api/v1/assessments/{id}`
- `PUT /api/v1/assessments/{id}`
- `DELETE /api/v1/assessments/{id}`
- `PUT /api/v1/assessments/{id}/publish`
- `POST /api/v1/assessments/{id}/duplicate`

Implementation notes:

- Add mappers: backend batch DTO to frontend batch view model, and frontend batch form to backend request.
- Change batch detail route to `/batches/:id` using UUID.
- Add assessment mapper for `batchIds`, `startAt`, `endAt`, uppercase enums, question options, coding details/templates/test cases.
- Use backend publish and duplicate endpoints instead of local status/copy logic.
- Keep Groq AI generation optional and separate from backend persistence.

Testing checklist:

- Teacher lists seeded students.
- Teacher creates a batch.
- Teacher enrolls student into batch.
- Teacher creates draft assessment assigned to batch.
- Teacher publishes assessment.
- Teacher duplicates assessment.
- Teacher deletes draft assessment.

Likely breaking points:

- Assessment builder payload shape is the largest mismatch.
- Frontend option correct-answer indexes must be converted to backend correct flags.
- Backend publish validation requires at least one batch, one question, duration, marks, and valid coding metadata.

### Phase 3: Student Core Flow

Files to modify later:

- `frontend/src/api/client.js`
- `frontend/src/context/LMSContext.jsx`
- `frontend/src/pages/StudentAssessments.jsx`
- `frontend/src/pages/StudentDashboard.jsx`
- `frontend/src/pages/TakeQuiz.jsx`
- `frontend/src/pages/TakeCoding.jsx`
- `frontend/src/pages/Results.jsx`
- `frontend/src/App.jsx`

APIs used:

- `GET /api/v1/students/me/assessments`
- `POST /api/v1/assessments/drafts/{studentId}/{assessmentId}`
- `GET /api/v1/assessments/drafts/{studentId}/{assessmentId}`
- `POST /api/v1/submissions/start`
- `POST /api/v1/submissions/{id}/submit`
- `GET /api/v1/submissions`
- `GET /api/v1/submissions/{id}/result`
- `POST /api/v1/coding-submissions/run`
- `POST /api/v1/coding-submissions`
- `GET /api/v1/coding-submissions`
- Optional: `POST /api/v1/files/upload`

Implementation notes:

- Prefer routes like `/take/:assessmentId` and `/take-coding/:assessmentId`; keep slug only as display.
- Start attempt by backend before rendering answer submission state.
- Save quiz and coding drafts to backend assessment draft JSON.
- Submit answers using `answerText` for scalar text/option answers and `answerJson` for arrays/files/code payloads.
- For coding run, call backend placeholder API and display placeholder message clearly.
- Result page should use backend result DTO directly.

Testing checklist:

- Student sees assigned published assessment.
- Student starts attempt.
- Student saves draft and reloads draft.
- Student submits MCQ/true-false/multiple-select answers.
- Student sees auto-graded result.
- Student runs coding placeholder.
- Student submits coding placeholder.

Likely breaking points:

- Existing pages lookup assessments by title slug.
- Existing draft state is spread between local answer state and per-language localStorage keys.
- Existing frontend submission status names differ from backend.

### Phase 4: Remaining Pages

Files to modify later:

- `frontend/src/pages/Evaluation.jsx`
- `frontend/src/pages/TeacherDashboard.jsx`
- `frontend/src/pages/StudentDashboard.jsx`
- `frontend/src/pages/Reports.jsx`
- `frontend/src/pages/Leaderboard.jsx`
- `frontend/src/components/Header.jsx`
- `frontend/src/pages/Settings.jsx`
- `frontend/src/context/LMSContext.jsx`
- `frontend/src/api/client.js`

APIs used:

- `GET /api/v1/submissions`
- `GET /api/v1/submissions/{id}/result`
- `PUT /api/v1/submissions/{id}/evaluation`
- `GET /api/v1/dashboard/teacher`
- `GET /api/v1/dashboard/student`
- `GET /api/v1/reports/overview`
- `GET /api/v1/reports/batches`
- `GET /api/v1/reports/students`
- `GET /api/v1/leaderboard`
- `GET /api/v1/notifications`
- `PUT /api/v1/notifications/{id}/read`
- `PUT /api/v1/notifications/read-all`
- `PUT /api/v1/users/me`
- `PUT /api/v1/users/me/password`
- `PUT /api/v1/users/me/notification-settings`

Implementation notes:

- Evaluation page should load backend submission list and result details, then send evaluation request.
- Dashboard/report pages should switch from local calculations to backend summary DTOs.
- Header should stop client-side notification visibility filtering once backend returns scoped notifications.
- Settings should persist profile/password/notification changes.

Testing checklist:

- Teacher lists only own submissions.
- Teacher evaluates one manual submission.
- Student sees evaluated result.
- Dashboards load without localStorage data.
- Reports charts render from backend DTOs.
- Leaderboard renders backend ranking.
- Notifications mark read and mark all read.
- Profile/password/settings updates persist after refresh.

Likely breaking points:

- Charts expect frontend-specific names and fallback values.
- Evaluation page currently uses Groq AI suggestions; backend does not provide AI evaluation.
- Notification response uses backend `read`; frontend expects `isRead`.

## Files To Modify Later

Core:

- `frontend/src/api/client.js`
- `frontend/src/context/LMSContext.jsx`
- `frontend/src/App.jsx`
- `frontend/.env.example`

Auth and layout:

- `frontend/src/pages/Login.jsx`
- `frontend/src/components/Header.jsx`
- `frontend/src/components/Sidebar.jsx`

Teacher flow:

- `frontend/src/pages/BatchManagement.jsx`
- `frontend/src/pages/BatchDetail.jsx`
- `frontend/src/pages/AssessmentBuilder.jsx`
- `frontend/src/pages/AssessmentDetail.jsx`
- `frontend/src/components/assessment-builder/EnterpriseBuilderLayout.jsx`
- `frontend/src/components/assessment-builder/ConfigPanel.jsx`
- `frontend/src/components/assessment-builder/QuestionBuilderPanel.jsx`

Student flow:

- `frontend/src/pages/StudentDashboard.jsx`
- `frontend/src/pages/StudentAssessments.jsx`
- `frontend/src/pages/TakeQuiz.jsx`
- `frontend/src/pages/TakeCoding.jsx`
- `frontend/src/pages/Results.jsx`

Remaining:

- `frontend/src/pages/Evaluation.jsx`
- `frontend/src/pages/Reports.jsx`
- `frontend/src/pages/Leaderboard.jsx`
- `frontend/src/pages/Settings.jsx`
- `frontend/src/utils/aiService.js` if AI behavior is retained or clearly separated.

## Manual Testing Checklist

Before frontend connection:

- Backend manually started by developer at `http://localhost:8082/api/v1` with `dev` profile.
- Dev seed users exist.
- Postman collections pass for auth, batch, assessment, submission, draft, coding placeholder, evaluation, dashboard/report/notification.

Phase 1:

- Login succeeds for teacher and student.
- Invalid login displays backend error.
- Refresh page keeps user session.
- Logout clears tokens and user state.
- Protected pages cannot be accessed without a token.

Phase 2:

- Teacher creates batch.
- Teacher enrolls seeded student.
- Teacher creates draft quiz assessment.
- Teacher creates coding assessment.
- Teacher publishes assessment.
- Duplicate creates a draft copy.
- Deleting assessment removes it from list.

Phase 3:

- Student sees assigned assessment.
- Student starts attempt.
- Draft save/get works after refresh.
- Student submits quiz.
- Student result loads from backend.
- Coding run displays placeholder response.
- Coding submit saves placeholder submission.

Phase 4:

- Teacher lists submissions and evaluates one.
- Student sees evaluated result with remarks.
- Dashboard values render.
- Reports charts render.
- Leaderboard loads.
- Notifications load and mark read.
- Settings profile/password/notification changes persist.

## Final Recommendation For First Coding Phase

Start with Phase 1 only.

Do not connect batches or assessments until auth is stable. The current app assumes a local `currentUser` object everywhere, so token storage, `GET /users/me`, role normalization, and explicit route protection must be solved first. After Phase 1, the rest of the integration can replace local arrays module by module without fighting the login/session foundation.

Recommended first code changes later:

1. Rewrite `frontend/src/api/client.js` as a real backend client with wrapper unwrapping and auth headers.
2. Add `VITE_API_BASE_URL=http://localhost:8082/api/v1` to `frontend/.env.example`.
3. Replace fake `login(email, role)` with backend login requiring password.
4. Load `currentUser` from `GET /api/v1/users/me`.
5. Normalize backend roles for route selection.
6. Add explicit `/login` and protected route behavior in `App.jsx`.
7. Make logout call backend logout then clear local auth state.
