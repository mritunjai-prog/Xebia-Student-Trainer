# Frontend Auth Integration Notes

## Scope

Phase 1 connects only the React login/session flow to the Spring Boot backend auth APIs. Batch, assessment, submission, dashboard, reports, leaderboard, notifications, and settings data remain in their existing local/mock frontend state until later phases.

## Backend URL

Set the Vite API base URL in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8082/api/v1
```

If the variable is missing, the frontend falls back to `http://localhost:8082/api/v1`.

## Login Flow

1. User selects Trainer or Student.
2. User enters email and password.
3. `authApi.login()` calls `POST /api/v1/auth/login`.
4. The API client unwraps the Spring response wrapper and returns `data`.
5. The LMS context stores tokens and the normalized current user.
6. Trainer users route to `/trainer-dashboard`.
7. Student users route to `/student-dashboard`.

Backend roles are stored as `backendRole` and normalized for existing frontend routing:

- `TEACHER` -> `teacher`
- `STUDENT` -> `student`

## Local Storage Keys

- `xebia_access_token`
- `xebia_refresh_token`
- `xebia_current_user`

The old fake auth key `session` is cleared when auth state is stored or removed.

## API Client Behavior

`frontend/src/api/client.js` provides:

- `api.get(path)`
- `api.post(path, body)`
- `api.put(path, body)`
- `api.delete(path)`
- `authApi.login({ email, password, role })`
- `authApi.logout()`
- `authApi.refresh()`
- `userApi.getMe()`

The client automatically:

- Adds `Authorization: Bearer <accessToken>` for authenticated calls.
- Parses JSON request and response bodies.
- Unwraps Spring `ApiResponse` objects.
- Throws clean errors for `success: false` or non-2xx HTTP responses.
- Clears the local auth session on `401 Unauthorized`.

## Seed Users

Use these dev users when the Spring Boot backend is running with seeded H2 data:

| Role | Email | Password |
| --- | --- | --- |
| Trainer | `teacher@example.com` | `password123` |
| Student | `student@example.com` | `password123` |

The quick-access buttons on the login screen fill these values only. They do not auto-login.

## Manual Test Steps

1. Start Spring Boot manually in dev profile on port `8082`.
2. Create `frontend/.env` from `frontend/.env.example` if needed.
3. Run the React app with `cd frontend` then `npm run dev`.
4. Open `/login`.
5. Select Trainer, use `teacher@example.com` / `password123`, and verify redirect to `/trainer-dashboard`.
6. Sign out and verify local auth keys are cleared.
7. Select Student, use `student@example.com` / `password123`, and verify redirect to `/student-dashboard`.
8. Open `/login` while authenticated and verify the app redirects to the role dashboard.

## Remaining Mock Areas

These areas are intentionally not connected in Phase 1:

- Batch management data
- Assessment builder data
- Student assessment list
- Quiz/coding attempt flows
- Submissions and evaluation
- Reports and dashboard metrics
- Leaderboard
- Notifications
- Settings/profile update APIs

## Next Phase

The next integration phase should connect the teacher core flow:

- List students
- List/create/update/delete batches
- Enroll students into batches
- Keep dashboard widgets local until their API contracts are finalized
