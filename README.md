# Mini Job Queue Management Dashboard

A full-stack job queue management dashboard built for the Airth React + NestJS internship assignment. The application provides a REST API and a responsive React dashboard for creating, filtering, transitioning, and deleting job records with proper validation, error handling, and concurrency-safe status transitions.

## Live Demo

- **Frontend:** https://mini-job-queue.vercel.app/
- **Backend API:** https://mini-job-queue-1.onrender.com
- **Swagger Documentation:** https://mini-job-queue-1.onrender.com/api/docs
- **Health Check:** https://mini-job-queue-1.onrender.com/health

## Links

- **GitHub:** https://github.com/Guptsonu22/Mini-Job-Queue
- **Live Frontend:** https://mini-job-queue.vercel.app/
- **Live Backend:** https://mini-job-queue-1.onrender.com
- **Swagger API Docs:** https://mini-job-queue-1.onrender.com/api/docs
- **Health Check:** https://mini-job-queue-1.onrender.com/health

## Overview

This project implements a job queue management system with:

- **Backend:** NestJS 10 + TypeORM, SQLite for local development, PostgreSQL for production (when `DATABASE_URL` is configured)
- **Frontend:** React 19 + Vite 8 + TypeScript + Tailwind CSS v4, consuming the REST API
- **Business rules enforced by backend:** `pending → running → completed | failed`. Terminal states cannot transition. Same-status updates are rejected with `409 Conflict`.
- **Concurrency-safe:** Atomic conditional database updates prevent race conditions when multiple clients attempt the same transition simultaneously.

The backend is the source of truth. Frontend transition checks exist only for user experience; direct API calls receive the same validation and protection.

**Important scope clarification:** This application manages job records and their lifecycle statuses. It does not execute real background jobs or run actual worker processes. It is a job queue management dashboard, not a complete background job execution system.

## Features

- Create jobs with title and type (validated, trimmed, max lengths enforced)
- View all jobs sorted by newest first (`createdAt DESC`)
- Filter jobs by status (All / Pending / Running / Completed / Failed)
- Update job status with only valid actions shown per state
- Delete jobs with confirmation dialog
- Status counts displayed from live data (Total, Pending, Running, Completed, Failed)
- Loading states (initial load, refresh, create, update, delete)
- Error states with retry action (network, 400, 404, 409, 500)
- Empty states (no jobs, filtered-empty)
- Responsive layout with status badges (amber/blue/green/red) and accessible labels
- `GET /health` endpoint and Swagger documentation at `/api/docs`
- Backend-enforced status transition rules
- Atomic concurrent update protection (409 Conflict on race)
- SQLite for local development, PostgreSQL for production

## How to Use

1. Open the live frontend: https://mini-job-queue.vercel.app/
2. Click **Create Job** → enter a title and type → click **Create Job**
3. The job appears in the table with status **Pending**
4. Click **Start** to move it to **Running**
5. From **Running**, click **Complete** or **Fail** to transition to a terminal state
6. Use the filter pills (All / Pending / Running / Completed / Failed) to narrow the list
7. Status cards at the top show live counts for each state
8. Click **Delete** on any job to remove it (with confirmation)
9. Test concurrency: open the dashboard in two tabs, create a pending job, click **Start** in both tabs simultaneously → one succeeds, one shows a conflict notice and reloads the actual state

## Tech Stack

### Backend

- NestJS 10
- TypeScript 5
- TypeORM 0.3
- SQLite (`sqlite3`) for local development
- PostgreSQL (`pg`) for production
- class-validator / class-transformer
- Swagger (`@nestjs/swagger`)
- Jest + Supertest for testing

### Frontend

- React 19
- Vite 8
- TypeScript 6
- Tailwind CSS v4
- React Hooks for state management
- Vitest + React Testing Library

### Deployment

- Backend: Render (Web Service + Managed PostgreSQL)
- Frontend: Vercel

## Architecture

```
React/Vite Frontend (port 5173)
         |
         | REST API (no /api prefix)
         v
NestJS Backend (port 3000)
         |
         v
TypeORM
         |
         v
SQLite (local)  /  PostgreSQL (production)
```

### Responsibilities

**Frontend**
- Displays jobs in a dashboard with stats, filters, and actions
- Handles user interactions (create, filter, transition, delete)
- Performs client-side UX validation (required fields, max lengths)
- Calls backend REST APIs
- Displays loading, error, empty, and conflict states
- Refetches data after mutations and conflicts

**Backend**
- Validates all incoming requests (global ValidationPipe with whitelist + forbidNonWhitelisted)
- Enforces business rules (status transitions, UUID format, field constraints)
- Handles status transitions with atomic conditional updates
- Reads and writes job records via TypeORM
- Protects against invalid concurrent updates at the database level
- Provides Swagger documentation and health check endpoint

**Database**
- Persists jobs with UUID, title, type, status, createdAt
- Executes conditional updates atomically
- SQLite locally (file-based, zero config)
- PostgreSQL in production (managed, persistent)

## Project Structure

```
Mini-Job-Queue/
├── backend/
│   ├── src/
│   │   ├── main.ts                 # CORS, ValidationPipe, Swagger, bootstrap
│   │   ├── app.module.ts           # ConfigModule, TypeORM (SQLite/Postgres switch)
│   │   ├── health.controller.ts    # GET /health
│   │   └── jobs/
│   │       ├── jobs.module.ts
│   │       ├── jobs.controller.ts  # POST/GET/PATCH/DELETE /jobs
│   │       ├── jobs.service.ts     # Business logic, atomic updates
│   │       ├── entities/job.entity.ts
│   │       ├── dto/
│   │       │   ├── create-job.dto.ts
│   │       │   ├── update-job-status.dto.ts
│   │       │   └── query-jobs.dto.ts
│   │       ├── enums/job-status.enum.ts
│   │       └── constants/job-transitions.ts
│   ├── test/
│   │   ├── jest-e2e.json
│   │   └── jobs.e2e-spec.ts
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── api/
│   │   │   ├── client.ts           # ApiError, base URL from VITE_API_URL
│   │   │   └── jobsApi.ts          # getJobs, createJob, updateJobStatus, deleteJob
│   │   ├── hooks/useJobs.ts        # jobs, loading, error, notice, mutations
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── JobStats.tsx
│   │   │   ├── JobForm.tsx
│   │   │   ├── JobFilters.tsx
│   │   │   ├── JobTable.tsx
│   │   │   ├── JobRow.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── types/job.ts
│   │   ├── utils/
│   │   │   ├── formatDate.ts
│   │   │   └── jobTransitions.ts   # UX-only mirror of backend rules
│   │   └── test/setup.ts
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── .gitignore
└── README.md
```

## Core Business Rules

### Allowed Status Transitions

| Current Status | Allowed Next Status |
|----------------|---------------------|
| pending        | running             |
| running        | completed, failed   |
| completed      | (none — terminal)   |
| failed         | (none — terminal)   |

### Rules

- New jobs are created with status `pending`
- `pending` can only transition to `running`
- `running` can transition to `completed` or `failed`
- `completed` and `failed` are terminal — no further transitions allowed
- Same-status updates (e.g., `running → running`) are rejected
- All invalid transitions return `409 Conflict`

## Status Transition Rules

The frontend mirrors transition rules for user experience (hiding invalid action buttons). The backend is the authoritative enforcer — direct API calls are subject to the same rules.

## Concurrency Handling

### The Problem

Two browser tabs show the same job as `pending`. Both users click "Start" (transition to `running`) at nearly the same time. Without protection, both requests could succeed, leaving the job in an inconsistent state.

### The Solution

The backend enforces transitions at the database level using an **atomic conditional update**:

```sql
UPDATE jobs
SET status = 'running'
WHERE id = ?
  AND status = 'pending';
```

### How It Works

1. Request arrives → service reads current job status
2. Validates transition is allowed (e.g., `pending → running`)
3. Executes single SQL statement: `UPDATE ... WHERE id = ? AND status = <expected>`
4. Database executes atomically — only one request can match the row
5. If `affected === 1` → success (200), return updated job
6. If `affected === 0` → re-read job:
   - Job missing → 404 Not Found
   - Job exists with different status → 409 Conflict ("Conflict: job is now X, cannot move to Y")
7. Frontend receives 409 → shows notice "This job was updated by another request. The latest status has been loaded." → refetches → displays actual server state

### Example

```
Tab A: PATCH /jobs/:id/status { "status": "running" } → 200 OK
Tab B: PATCH /jobs/:id/status { "status": "running" } → 409 Conflict
Final job status: running
```

### Why This Is Safe

- The condition `AND status = 'pending'` is part of the SQL statement
- The database executes it atomically (row-level lock in Postgres, serialized writes in SQLite)
- No read-then-write race window
- Direct API callers (curl, Postman) receive the same protection — the rule lives in the backend, not React
- `SQLITE_BUSY` errors are caught and mapped to 409 Conflict

### Trade-offs

- SQLite serializes all writes; under high contention, `SQLITE_BUSY` may occur (mapped to 409)
- Postgres uses row-level locking; better concurrency
- No distributed lock manager — not needed for this scale
- Same-status updates are rejected (409) to keep concurrency deterministic

## API Documentation

| Method | Endpoint                 | Description          | Success | Common Errors           |
|--------|--------------------------|----------------------|---------|-------------------------|
| POST   | `/jobs`                  | Create a job         | 201     | 400                     |
| GET    | `/jobs`                  | List all jobs        | 200     | 400                     |
| GET    | `/jobs?status=pending`   | Filter jobs by status| 200     | 400                     |
| PATCH  | `/jobs/:id/status`       | Update job status    | 200     | 400, 404, 409           |
| DELETE | `/jobs/:id`              | Delete a job         | 204     | 400, 404                |
| GET    | `/health`                | Health check         | 200     | —                       |
| GET    | `/api/docs`              | Swagger UI           | 200     | —                       |

> **Note:** No `/api` prefix is used for job routes. Routes are mounted at root (`/jobs`, `/health`, `/api/docs`).

### Create Job

**Request:**
```json
POST /jobs
Content-Type: application/json

{
  "title": "Send welcome email",
  "type": "email"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Send welcome email",
  "type": "email",
  "status": "pending",
  "createdAt": "2026-09-15T10:00:00.000Z"
}
```

- `title`: required, 1–200 characters, trimmed
- `type`: required, 1–100 characters, trimmed
- `status` is assigned by backend (`pending`); sending it returns 400
- Unknown fields rejected (400)

### Update Job Status

**Request:**
```json
PATCH /jobs/:id/status
Content-Type: application/json

{
  "status": "running"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Send welcome email",
  "type": "email",
  "status": "running",
  "createdAt": "2026-09-15T10:00:00.000Z"
}
```

- `:id` must be a valid UUID (400 if invalid)
- `status` must be one of: `pending`, `running`, `completed`, `failed` (400 otherwise)
- 404 if job not found
- 409 if transition invalid or concurrent conflict

### Delete Job

**Request:**
```
DELETE /jobs/:id
```

**Response:** 204 No Content (404 if missing)

### Error Response Shape

All errors follow NestJS default shape:
```json
{
  "statusCode": 409,
  "message": "Invalid status transition from completed to running",
  "error": "Conflict"
}
```

## Validation and Error Handling

### Backend Validation

- **Title:** required, string, trimmed, max 200 chars, rejects empty/whitespace
- **Type:** required, string, trimmed, max 100 chars, rejects empty/whitespace
- **Status (update):** must be valid enum value
- **UUID:** validated via `ParseUUIDPipe` (400 if malformed)
- **Unknown fields:** rejected (global `forbidNonWhitelisted: true`)
- **Job not found:** 404
- **Invalid transition:** 409 Conflict
- **Concurrency conflict:** 409 Conflict
- **Server errors:** 500

### Frontend Error Handling

- **Loading:** skeleton + "Loading jobs…" during initial fetch and refresh
- **Create/Update/Delete:** per-action loading states, buttons disabled
- **Network/500/400/404:** red alert with message + Retry button (initial load) or dismissible toast
- **409 Conflict:** amber notice "This job was updated by another request. The latest status has been loaded." + auto-refetch + Dismiss button
- **Empty states:** "No jobs found" (unfiltered) or "No jobs match this filter" (filtered)
- **Accessibility:** `aria-live="polite"` on notices, proper labels, roles

### Validation Philosophy

> Frontend validation improves UX. Backend validation protects the API. The backend is the source of truth.

## Local Setup

### Windows PowerShell

**Backend (terminal 1):**
```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run start:dev
# http://localhost:3000/health, http://localhost:3000/api/docs
```

**Frontend (terminal 2):**
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
# http://localhost:5173
```

### macOS / Linux

**Backend (terminal 1):**
```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
# http://localhost:3000/health, http://localhost:3000/api/docs
```

**Frontend (terminal 2):**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# http://localhost:5173
```

### Default URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Health | http://localhost:3000/health |
| Swagger | http://localhost:3000/api/docs |

Run backend and frontend in separate terminals.

## Environment Variables

### Backend (`backend/.env` — see `backend/.env.example`)

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SQLITE_PATH=data.sqlite
# DATABASE_URL=postgresql://user:pass@host:5432/db   # production only
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | CORS origin (also allows `http://localhost:5173`) | `http://localhost:5173` |
| `SQLITE_PATH` | SQLite file path (dev only) | `data.sqlite` |
| `DATABASE_URL` | PostgreSQL connection string (prod only) | — |

### Frontend (`frontend/.env` — see `frontend/.env.example`)

```env
VITE_API_URL=http://localhost:3000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend base URL (no trailing slash, no `/api` suffix) | `http://localhost:3000` |

### Production Changes

| Environment | Backend | Frontend |
|-------------|---------|----------|
| `NODE_ENV` | `production` | — |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `FRONTEND_URL` | `https://mini-job-queue.vercel.app` | — |
| `VITE_API_URL` | — | `https://mini-job-queue-1.onrender.com` |

> **Important:** `VITE_API_URL` must not include `/api` — backend routes are mounted at root (`/jobs`, not `/api/jobs`). Vite requires `VITE_` prefix for client-exposed variables. Do not add a trailing slash to `FRONTEND_URL`.

## Testing

### Backend

```bash
cd backend
npm test           # Unit tests — 11/11 pass
npm run test:e2e   # E2E tests — 11/11 pass (includes concurrent race test)
npm run build      # Production build — passes
```

**Unit tests** (`jobs.service.spec.ts`): create, list order, valid transition, invalid transitions (pending→completed, terminal→running, same-status), concurrent race (affected=0 → 409), 404 handling, delete.

**E2E tests** (`jobs.e2e-spec.ts`): full HTTP flow including parallel `pending → running` → `[200, 409]`.

### Frontend

```bash
cd frontend
npm test        # 12/12 pass (Dashboard 9 + transitions 3)
npm run build   # Production build — passes
npm run lint    # 0 errors, 1 warning (setState in useEffect — standard pattern)
```

**Tests cover:** render/load, stats counts, filter, form validation, create success, duplicate prevention, valid status actions, 409 conflict notice + refetch, error state + retry, empty state.

### Live API Verification (manual)

Verified with curl against deployed backend:
- CRUD operations
- All invalid transitions → 409
- Validation errors → 400
- Missing job → 404
- Concurrent race → `[200, 409]`
- Swagger UI → 200

### Production Verification (manual)

Verified against live deployed URLs:
- Frontend loads at https://mini-job-queue.vercel.app/
- Backend health at https://mini-job-queue-1.onrender.com/health
- Swagger at https://mini-job-queue-1.onrender.com/api/docs
- Create job → appears in list
- Transition `pending → running → completed` → counts update
- Invalid transition → 409 error shown
- Delete job → removal confirmed
- Filter by status → works
- Concurrency test: two tabs, same pending job, both click Start → one 200, one 409 → notice appears → final status = running
- Network tab confirms all requests go to `https://mini-job-queue-1.onrender.com/jobs`
- CORS verified: no errors in browser console

## Production Build

### Backend

```bash
cd backend
npm run build       # Compiles to dist/
npm run start:prod  # Runs dist/main.js
```

### Frontend

```bash
cd frontend
npm run build       # TypeScript compile + Vite build → dist/
# Output: dist/index.html, dist/assets/*.js, dist/assets/*.css
```

## Deployment

### Backend — Render

1. Create a **Web Service** on Render, connect GitHub repo `Guptsonu22/Mini-Job-Queue`
2. **Root Directory:** `backend`
3. **Build Command:** `npm install && npx nest build`
4. **Start Command:** `npm run start:prod`
5. **Node Version:** 20 (or specify in `package.json` engines)
6. Add a **Managed PostgreSQL** database on Render
7. Set environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL` = (copy Internal Connection String from Postgres)
   - `FRONTEND_URL` = `https://mini-job-queue.vercel.app`
8. **Health Check Path:** `/health`
9. Deploy → verify `https://mini-job-queue-1.onrender.com/health` returns `{"status":"ok","timestamp":"..."}`
10. Verify `https://mini-job-queue-1.onrender.com/api/docs` loads Swagger UI
11. Test POST/GET/PATCH/DELETE against production URL

> **Critical:** Do not use SQLite on Render. The filesystem is ephemeral — data would be lost on restart. Use the managed PostgreSQL.

### Frontend — Vercel

1. Import the same GitHub repo on Vercel
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite (auto-detected)
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment Variable:** `VITE_API_URL=https://mini-job-queue-1.onrender.com`
7. Deploy → verify dashboard loads and Network tab shows requests to Render backend

### Post-Deployment Verification

- Open Vercel URL in browser
- Create a job → verify it appears
- Transition `pending → running → completed` → verify counts update
- Attempt invalid transition → verify 409 error shown
- Delete job → verify removal
- Filter by status → verify filtering works
- Open two tabs, create pending job, both click Start → one 200, one 409 → notice appears → final status = running

## Assumptions and Trade-offs

- **SQLite locally** for zero-setup development; **PostgreSQL in production** because Render's filesystem is ephemeral
- **Backend is the source of truth**; frontend transition logic is UX-only
- **Same-status updates rejected (409)** to keep concurrency deterministic
- **`synchronize: true` only for SQLite dev**; production Postgres uses `synchronize: false` (migrations would be a future improvement)
- **No authentication** — out of assignment scope
- **Single jobs table** — sufficient for assignment scale; no pagination
- **No real background workers** — the assignment manages job records and status transitions, not actual async job execution
- **No distributed locking** — not required; atomic conditional update is sufficient

## Bonus Production Improvement

### Health Check Endpoint (`GET /health`)

**What:** A simple health check endpoint returning `{ "status": "ok", "timestamp": "..." }`

**Where:** `backend/src/health.controller.ts` — mounted at `/health`

**Why it improves production readiness:**
- Enables Render's built-in health checks for zero-downtime deploys
- Allows load balancers / uptime monitors to verify service liveness
- Provides a lightweight endpoint that doesn't hit the database
- Standard practice for containerized/cloud-native services

**Implementation:**
```typescript
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

This is a small, zero-dependency addition that significantly improves operational visibility in production.

## Future Improvements

- Authentication and authorization (JWT, roles)
- Pagination and search for large job lists
- Job retry mechanism and dead-letter handling
- Background workers using BullMQ for actual async job execution
- WebSocket / Server-Sent Events for live dashboard updates
- Structured logging (Pino/Winston) with correlation IDs
- Monitoring and alerts (Prometheus + Grafana, or Datadog)
- Dockerfile for consistent local and production environments
- Database migrations (TypeORM migrations instead of `synchronize`)
- Rate limiting and API throttling
- Audit history / event sourcing for job state changes
- Role-based permissions and multi-tenancy

## Final Submission Checklist

- [x] Public GitHub repository
- [x] Backend implementation (NestJS + TypeORM)
- [x] Frontend implementation (React + Vite + Tailwind)
- [x] API validation (class-validator + global ValidationPipe)
- [x] Error handling (400, 404, 409, 500)
- [x] Status transition protection (backend-enforced)
- [x] Concurrency handling (atomic conditional UPDATE)
- [x] Automated tests (backend unit 11/11, E2E 11/11, frontend 12/12)
- [x] README documentation
- [x] Live backend deployed (Render)
- [x] Live frontend deployed (Vercel)
- [x] Production URLs verified
- [x] Production CORS verified
- [x] Production CRUD verified

---

*Last updated: 2026-09-15*