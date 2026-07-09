# Xebia Student-Trainer Assessment Portal

A full-stack assessment portal with a React/Vite frontend and a Java Spring Boot backend.

## Project Structure

```text
Xebia-Student-Trainer-main/
  frontend/          React + Vite frontend
  spring-backend/    Java Spring Boot backend
  docs/              Project/frontend integration notes
  README.md
  .gitignore
```

Do not run the frontend from the project root anymore. The frontend now lives in `frontend/`.

## Backend

Run backend commands from `spring-backend/`.

```bash
cd spring-backend
mvn spring-boot:run "-Dspring-boot.run.profiles=dev" "-Dspring-boot.run.arguments=--server.port=8082"
```

The backend dev API base URL is:

```text
http://localhost:8082/api/v1
```

The `dev` profile uses the existing local H2 setup for API testing. PostgreSQL configuration remains placeholder-only unless you configure it separately.

## Frontend

Run frontend commands from `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on:

```text
http://localhost:3000
```

## Frontend Environment

Create or update `frontend/.env` for local testing:

```env
VITE_API_BASE_URL=http://localhost:8082/api/v1
```

`frontend/.env.example` contains the same backend API URL as a template.

Do not commit `.env` files. They are ignored by Git.

## Build Checks

Frontend:

```bash
cd frontend
npm install
npm run build
```

Backend:

```bash
cd spring-backend
mvn -q -DskipTests package
```

## Notes

- Run the backend from `spring-backend/`.
- Run the frontend from `frontend/`.
- Keep the backend API base URL as `http://localhost:8082/api/v1`.
- The React UI/UX and backend business logic are intentionally unchanged by the folder restructure.
