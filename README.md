# Mini Job Queue Management Dashboard

A full-stack job queue management dashboard built for the Airth React + NestJS internship assignment. Provides a REST API and a responsive React dashboard for creating, filtering, transitioning, and deleting job records with validation, error handling, and concurrency-safe status transitions.

**Important scope clarification:** This application manages job records and their lifecycle statuses. It does not execute real background jobs or run worker processes.

## Live Links

- **Frontend:** https://mini-job-queue.vercel.app/
- **Backend API:** https://mini-job-queue-1.onrender.com
- **Swagger Documentation:** https://mini-job-queue-1.onrender.com/api/docs
- **Health Check:** https://mini-job-queue-1.onrender.com/health
- **GitHub:** https://github.com/Guptsonu22/Mini-Job-Queue

## Overview

| | |
|---|---|
| **Backend** | NestJS 10 + TypeORM, SQLite (local), PostgreSQL (production) |
| **Frontend** | React 19 + Vite 8 + TypeScript + Tailwind CSS v4 |
| **Deployment** | Backend on Render with managed PostgreSQL; Frontend on Vercel |

**Business rules (enforced by backend):**
- `pending → running → completed | failed`
- Terminal states (`completed`, `failed`) cannot transition
- Same-status updates rejected with `409 Conflict`
- Backend is the source of truth; frontend checks are UX-only

## Features

- Create jobs with title and type (validated, trimmed, max lengths)
- View jobs sorted by newest first (`createdAt DESC`)
- Filter by status (All / Pending / Running / Completed / Failed)
- Update status with only valid actions shown per state
- Delete jobs with confirmation
- Live status counts (Total, Pending, Running, Completed, Failed)
- Loading, error, empty, and filtered-empty states
- `GET /health` endpoint and Swagger at `/api/docs`
- Atomic concurrent update protection (409 Conflict on race)
- SQLite locally, PostgreSQL in production

## How to Use

1. Open https://mini-job-queue.vercel.app/
2. Click **Create Job** → enter title and type → **Create Job**
3. Job appears as **Pending** → click **Start** → **Running**
4. From **Running**, click **Complete** or **Fail** for terminal state
5. Filter with pills (All / Pending / Running / Completed / Failed)
5. Status cards show live counts
6. Click **Delete** to remove (with confirmation)
6. Test concurrency: open two tabs, same pending job, both click **Start** → one succeeds, one shows conflict notice and reloads actual state

## Tech Stack

**Backend:** NestJS 10, TypeScript, TypeORM 0.3, SQLite (`sqlite3`), PostgreSQL (`pg`), class-validator, class-transformer, Swagger, Jest + Supertest

**Frontend:** React 19, Vite 8, TypeScript, Tailwind CSS v4, React Hooks, Vitest + React Testing Library

**Deployment:** Render (backend + managed PostgreSQL), Vercel (frontend)

## Architecture

```
React/Vite Frontend (5173)
         |
         | REST API (no /api prefix)
         v
NestJS Backend (3000)
         |
         v
TypeORM
         |
         v
SQLite (local)  /  PostgreSQL (production)
```

**Responsibilities**
- **Frontend:** Dashboard display, user interactions, UX validation, API calls, loading/error/conflict states, refetch after mutations
- **Backend:** Request validation, business rules, atomic status transitions, TypeORM persistence, concurrency protection, Swagger + health endpoint
- **Database:** Persist jobs (UUID, title, type, status, createdAt), atomic conditional updates, SQLite locally / PostgreSQL in production

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
│   │       ├── enums/job-status.enum.ts
│   │       └── constants/job-transitions.ts
│   ├── test/
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── api/ (client.ts, jobsApi.ts)
│   │   ├── hooks/useJobs.ts
│   │   ├── components/ (Dashboard, JobStats, JobForm, JobFilters, JobTable, JobRow, StatusBadge, LoadingState, ErrorState, EmptyState)
│   │   ├── types/job.ts
│   │   ├── utils/ (formatDate.ts, jobTransitions.ts)
│   │   └── test/setup.ts
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── .gitignore
└── README.md
```

## Status Transitions

| Current | Allowed Next |
|---------|--------------|
| pending | running |
| running | completed, failed |
| completed | (terminal) |
| failed | (terminal) |

**Rules:**
- New jobs start as `pending`
- `pending` → `running` only
- `running` → `completed` or `failed`
- `completed` / `failed` are terminal
- Same-status updates rejected (409)
- All invalid transitions return 409 Conflict
- Frontend mirrors rules for UX; backend is the enforcer

## Concurrency Handling

Two tabs show a `pending` job. Both click **Start** simultaneously. Without protection, both could succeed.

**Solution:** Atomic conditional update at the database level.

```sql
UPDATE jobs
SET status = 'running'
WHERE id = ?
  AND status = 'pending';
```

**How it works:**
1. Request arrives → read current status
2. Validate transition allowed
3. Execute single SQL statement with `WHERE id = ? AND status = <expected>`
4. Database executes atomically — only one request matches
5. `affected === 1` → success (200)
6. `affected === 0` → re-read: missing (404) or different status (409)
7. Frontend on 409: shows notice, refetches, displays actual state

**Example:**
```
Tab A: PATCH /jobs/:id/status { "status": "running" } → 200 OK
Tab B: PATCH /jobs/:id/status { "status": "running" } → 409 Conflict
Final status: running
```

**Trade-offs:** SQLite serializes writes (`SQLITE_BUSY` → 409); Postgres uses row-level locking. Same-status updates rejected (409) for deterministic concurrency.

## API Endpoints

| Method | Endpoint | Description | Success | Errors |
|--------|----------|-------------|---------|--------|
| POST | `/jobs` | Create job | 201 | 400 |
| GET | `/jobs` | List jobs | 200 | 400 |
| GET | `/jobs?status=pending` | Filter by status | 200 | 400 |
| PATCH | `/jobs/:id/status` | Update status | 200 | 400, 404, 409 |
| DELETE | `/jobs/:id` | Delete job | 204 | 400, 404 |
| GET | `/health` | Health check | 200 | — |
| GET | `/api/docs` | Swagger UI | 200 | — |

> **Note:** No `/api` prefix for job routes. Routes at root (`/jobs`, `/health`, `/api/docs`).

### Create Job
```json
POST /jobs
{ "title": "Send welcome email", "type": "email" }
```
Response 201: `{ "id": "uuid", "title": "...", "type": "...", "status": "pending", "createdAt": "..." }`
- `title`: required, 1–200 chars, trimmed
- `type`: required, 1–100 chars, trimmed
- `status` set by backend; sending it returns 400
- Unknown fields rejected (400)

### Update Status
```json
PATCH /jobs/:id/status
{ "status": "running" }
```
- `:id` must be valid UUID (400 if invalid)
- `status` must be valid enum (400 otherwise)
- 404 if not found, 409 if invalid transition or conflict

### Delete Job
`DELETE /jobs/:id` → 204 (404 if missing)

### Error Shape
```json
{ "statusCode": 409, "message": "Invalid status transition...", "error": "Conflict" }
```

## Validation & Error Handling

**Backend:**
- Title: required, string, trimmed, max 200, rejects empty/whitespace
- Type: required, string, trimmed, max 100, rejects empty/whitespace
- Status: valid enum only
- UUID via `ParseUUIDPipe` (400 if invalid)
- Unknown fields rejected (`forbidNonWhitelisted: true`)
- Not found: 404, Invalid transition: 409, Concurrency: 409, Server: 500

**Frontend:**
- Loading skeletons for initial fetch and refresh
- Per-action loading states, buttons disabled
- Network/500/400/404: alert with Retry (initial) or dismissible toast
- 409: amber notice + auto-refetch + dismiss
- Empty states: "No jobs found" / "No jobs match this filter"
- Accessible: `aria-live="polite"`, proper labels, roles

> Frontend validation improves UX. Backend validation protects the API. Backend is the source of truth.

## Local Setup

**Windows PowerShell**
```powershell
# Backend (terminal 1)
cd backend
npm install
Copy-Item .env.example .env
npm run start:dev
# http://localhost:3000/health, http://localhost:3000/api/docs

# Frontend (terminal 2)
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
# http://localhost:5173
```

**macOS / Linux**
```bash
# Backend (terminal 1)
cd backend
npm install
cp .env.example .env
npm run start:dev

# Frontend (terminal 2)
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Default URLs**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Health | http://localhost:3000/health |
| Swagger | http://localhost:3000/api/docs |

Run backend and frontend in separate terminals.

## Environment Variables

**Backend** (`backend/.env` — see `.env.example`)
```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SQLITE_PATH=data.sqlite
# DATABASE_URL=postgresql://...   # production only
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | CORS origin (also allows `http://localhost:5173`) | `http://localhost:5173` |
| `SQLITE_PATH` | SQLite file (dev only) | `data.sqlite` |
| `DATABASE_URL` | PostgreSQL connection string (prod) | — |

**Frontend** (`frontend/.env` — see `.env.example`)
```env
VITE_API_URL=http://localhost:3000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend base URL (no trailing slash, no `/api`) | `http://localhost:3000` |

**Production changes:**
- Backend: `NODE_ENV=production`, `DATABASE_URL=<postgres>`, `FRONTEND_URL=https://mini-job-queue.vercel.app`
- Frontend: `VITE_API_URL=https://mini-job-queue-1.onrender.com` (no trailing slash, no `/api`)

## Testing

```bash
# Backend
cd backend
npm test           # Unit: 11/11 pass
npm run test:e2e   # E2E: 11/11 pass (includes concurrent race)
npm run build      # Build passes

# Frontend
cd frontend
npm test        # 12/12 pass
npm run build   # Build passes
npm run lint    # 0 errors, 1 warning (setState in useEffect)
```

**Coverage:**
- Backend unit: create, list order, valid/invalid transitions, concurrent race (affected=0 → 409), 404, delete
- Backend E2E: full HTTP flow including parallel `pending → running` → `[200, 409]`
- Frontend: render/load, stats, filter, form validation, create, duplicate prevention, status actions, 409 notice+refetch, error+retry, empty state

Manual verification against deployed URLs confirms CRUD, invalid transitions (409), validation (400), missing job (404), concurrent race (`[200, 409]`), Swagger, CORS, and network requests target the Render backend.

## Production Build

```bash
# Backend
cd backend
npm run build       # → dist/
npm run start:prod  # runs dist/main.js

# Frontend
cd frontend
npm run build       # → dist/
```

## Deployment

**Backend — Render**
- Web Service, root `backend`
- Build: `npm install && npx nest build`
- Start: `npm run start:prod`
- Add managed PostgreSQL, set `DATABASE_URL`
- Env: `NODE_ENV=production`, `FRONTEND_URL=https://mini-job-queue.vercel.app`
- Health check: `/health`
- **Do not use SQLite on Render** — filesystem is ephemeral

**Frontend — Vercel**
- Import repo, root `frontend`, Framework: Vite
- Build: `npm run build`, Output: `dist`
- Env: `VITE_API_URL=https://mini-job-queue-1.onrender.com` (no trailing slash, no `/api`)

**Post-deploy:** Update Render `FRONTEND_URL` to Vercel URL, redeploy backend.

## Assumptions & Trade-offs

- SQLite locally (zero setup); PostgreSQL in production (Render filesystem is ephemeral)
- Backend is source of truth; frontend transition logic is UX-only
- Same-status updates rejected (409) for deterministic concurrency
- `synchronize: true` only for SQLite dev; Postgres uses `synchronize: false`
- No authentication (out of scope)
- Single jobs table, no pagination
- No real background workers — manages records and status transitions only
- No distributed locking; atomic conditional update is sufficient

## Bonus: Health Check Endpoint

**GET /health** → `{ "status": "ok", "timestamp": "..." }` at `backend/src/health.controller.ts`

Enables Render health checks, load balancer checks, uptime monitoring. Lightweight, no database hit.

```typescript
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

## Future Improvements

- Authentication/authorization (JWT, roles)
- Pagination and search
- Job retry and dead-letter handling
- Background workers (BullMQ) for actual async execution
- WebSocket/SSE for live updates
- Structured logging with correlation IDs
- Monitoring (Prometheus/Grafana)
- Dockerfile
- Database migrations (TypeORM)
- Rate limiting
- Audit history / event sourcing
- Role-based permissions

## Final Submission Checklist

- [x] Public GitHub repository
- [x] Backend implementation (NestJS + TypeORM)
- [x] Frontend implementation (React + Vite + Tailwind)
- [x] API validation (class-validator + ValidationPipe)
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