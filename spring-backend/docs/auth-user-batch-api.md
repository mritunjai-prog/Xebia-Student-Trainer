# Auth, User, and Batch API Testing Guide

This guide covers temporary local testing for the Spring Boot backend only. It does not connect the React frontend.

## Run Backend In Dev Profile

The `dev` profile uses an in-memory H2 database for local API testing only. It is not production storage.

PowerShell:

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=8081"
```

Git Bash or macOS/Linux shells:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments=--server.port=8081
```

This command starts a long-running Spring Boot server. After logs show `Started PortalApplication`, stop it with `Ctrl+C`.

Base URL:

```text
http://localhost:8081
```

PostgreSQL remains configured separately in `application-postgres.properties` with placeholder credentials.

## Seed Users

`DataSeeder` runs only when the `dev` profile is active.

Teacher:

```text
email: teacher@example.com
password: password123
role: TEACHER
```

Student:

```text
email: student@example.com
password: password123
role: STUDENT
```

Passwords are stored with BCrypt.

## Expected Response Format

Success:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "errors": []
}
```

Error:

```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": []
}
```

## Login

Teacher login:

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

Student login:

```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "STUDENT"
}
```

Use the returned access token for protected APIs.

## Auth Header

```text
Authorization: Bearer <accessToken>
```

## Auth APIs

Refresh token:

```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "<refreshToken>"
}
```

Logout:

```http
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

Logout is currently stateless and returns a successful placeholder response. Refresh-token persistence/revocation is still TODO.

## User APIs

Get current user:

```http
GET /api/v1/users/me
Authorization: Bearer {{teacherToken}}
```

Update profile:

```http
PUT /api/v1/users/me
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "name": "Teacher Demo",
  "email": "teacher@example.com",
  "phone": "9999999999",
  "bio": "Trainer profile for API testing",
  "avatarUrl": null
}
```

Update password:

```http
PUT /api/v1/users/me/password
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "currentPassword": "password123",
  "newPassword": "password123"
}
```

Update notification settings:

```http
PUT /api/v1/users/me/notification-settings
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "notifyPush": true,
  "notifyGraded": true,
  "notifyDeadline": true,
  "soundEffects": true,
  "language": "English",
  "theme": "light"
}
```

List students. Teacher token required:

```http
GET /api/v1/users?role=STUDENT
Authorization: Bearer {{teacherToken}}
```

## Batch APIs

All batch APIs require a teacher token.

Create batch:

```http
POST /api/v1/batches
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "name": "Java Spring Boot Batch",
  "course": "Backend Development",
  "icon": "BookOpen",
  "status": "ACTIVE",
  "studentIds": ["{{studentId}}"]
}
```

List batches:

```http
GET /api/v1/batches
Authorization: Bearer {{teacherToken}}
```

Get batch:

```http
GET /api/v1/batches/{{batchId}}
Authorization: Bearer {{teacherToken}}
```

Update batch:

```http
PUT /api/v1/batches/{{batchId}}
Authorization: Bearer {{teacherToken}}
Content-Type: application/json
```

```json
{
  "name": "Advanced Java Spring Boot Batch",
  "course": "Backend Development",
  "icon": "Code",
  "status": "ACTIVE",
  "studentIds": ["{{studentId}}"]
}
```

Replace enrolled students:

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

Delete batch:

```http
DELETE /api/v1/batches/{{batchId}}
Authorization: Bearer {{teacherToken}}
```

## Common Errors

- `401 Authentication required`: missing or invalid access token.
- `401 Invalid email or password`: login credentials or role are wrong.
- `403 Access denied`: valid token but role is not allowed, such as student calling batch APIs.
- `400 Validation failed`: missing required fields or invalid request body.
- `400 Batch name already exists`: duplicate batch name on create/update.
- `400 Invalid student id`: enrollment contains a user ID that is missing or is not a student.
- `404 Batch not found`: batch ID does not exist.
