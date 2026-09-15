# Mini Job Queue Management Dashboard

Full-stack job queue dashboard: create jobs, filter by status, transition statuses safely, delete jobs, with concurrency protection.

## Overview

- **Backend:** NestJS + TypeORM, SQLite locally, PostgreSQL in production when `DATABASE_URL` is set.
- **Frontend:** React + Vite + TypeScript + Tailwind CSS dashboard consuming the REST API.
- Business rule (enforced by backend): `pending → running → completed | failed`. Terminal states cannot transition. Same-status updates are rejected with `409`.

## Features

- Create jobs (title + type, validated, trimmed, max lengths).
- View jobs sorted `createdAt DESC`.
- Filter by status (`All / Pending / Running / Completed / Failed`).
- Update job status with only valid actions shown (`Start`, `Complete`, `Fail`).
- Delete jobs (with confirm).
- Status counts from live data.
- Loading / error (+Retry) / empty / filtered-empty states.
- `409 Conflict` handling: shows “This job was updated by another request. The latest status has been loaded.” and refetches.
- Responsive layout, status badges (amber/blue/green/red), accessible labels.
- `GET /health`, Swagger at `/api/docs`.

## Tech Stack

- Backend: NestJS 10, TypeScript, TypeORM 0.3, SQLite (`sqlite3`), `pg` for Postgres, `class-validator`, Swagger, Jest + Supertest.
- Frontend: React 19, Vite 8, TypeScript, Tailwind CSS v4, Vitest + React Testing Library.
- Deploy: Render (backend + Postgres), Vercel (frontend).

## Project Structure

```text
Job Queue Management/
├── backend/
│   ├── src/main.ts            # CORS, ValidationPipe, Swagger
│   ├── src/app.module.ts      # SQLite dev / Postgres prod switch
│   ├── src/health.controller.ts
│   ├── src/jobs/              # module, controller, service
│   │   ├── entities/job.entity.ts
│   │   ├── dto/               # create / update-status / query
│   │   ├── enums/job-status.enum.ts
│   │   └── constants/job-transitions.ts
│   └── test/jobs.e2e-spec.ts
├── frontend/
│   ├── src/api/               # client + jobsApi (VITE_API_URL)
│   ├── src/hooks/useJobs.ts   # jobs/loading/error/notice/mutations
│   ├── src/components/        # Dashboard, stats, form, filters, table…
│   ├── src/utils/             # jobTransitions (UX only), formatDate
│   └── src/types/job.ts
```

## Local Setup

Backend (terminal 1):

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
# http://localhost:3000/health, http://localhost:3000/api/docs
```

Frontend (terminal 2):

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# http://localhost:5173
```

## API Endpoints

| Method | Path               | Success | Errors              |
| ------ | ------------------ | ------- | ------------------- |
| POST   | `/jobs`            | 201 Job | 400 invalid input   |
| GET    | `/jobs`            | 200 Job[] (sorted `createdAt DESC`) | 400 bad `?status` |
| GET    | `/jobs?status=pending` | 200 filtered | 400 |
| PATCH  | `/jobs/:id/status` | 200 Job | 400 bad id/body, 404 missing, 409 invalid/concurrent |
| DELETE | `/jobs/:id`        | 204     | 400 bad id, 404 missing |
| GET    | `/health`          | 200 `{status:'ok'}` | — |
| GET    | `/api/docs`        | Swagger UI | — |

Create: `{ "title": "Send welcome email", "type": "email" }` → status defaults `pending`. Client must not send `status` (400).
Update: `{ "status": "running" }`.

## Status Transitions

Allowed:

```text
pending → running
running → completed
running → failed
```

Rejected with `409` (all others, including same-status, terminal→anything, `pending→completed`, `pending→failed`, `running→pending`).

## Concurrency Handling

Two tabs see `pending`; both `PATCH → running`. Backend runs one atomic statement:

```sql
UPDATE jobs SET status='running' WHERE id=? AND status='pending';
```

One request affects 1 row → `200`. The other affects 0 rows → re-read → `409 Conflict`. Frontend shows a notice and refetches; it never fakes success. Direct API calls get the same guarantee because the rule lives in the DB update, not in React. Trade-off: SQLite serializes writes (`SQLITE_BUSY` mapped to `409`); Postgres uses the same statement with row-level atomicity. No distributed lock claimed.

## Testing (actual results, 2026-09-15)

Backend:

```bash
cd backend
npm test        # 11/11 pass (jobs.service.spec.ts)
npm run test:e2e # 11/11 pass (incl. parallel pending→running → [200,409])
npm run build   # passes
```

Frontend:

```bash
cd frontend
npm test        # 12/12 pass (Dashboard 9 + transitions 3)
npm run build   # passes (tsc -b && vite build)
npm run lint    # 0 errors, 1 warning (initial-fetch setState-in-effect, standard pattern)
```

Live API also verified with curl: CRUD, all invalid transitions → `409`, validation → `400`, missing → `404`, parallel race → `[200,409]`, Swagger `200`.

## Environment Variables

Backend (`backend/.env`, see `.env.example`):

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SQLITE_PATH=data.sqlite
# DATABASE_URL=postgresql://user:pass@host:5432/db  # production only
```

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3000
```

Deployment changes: backend `FRONTEND_URL=https://<vercel-app>`, `DATABASE_URL=<postgres-url>`, `NODE_ENV=production`; frontend `VITE_API_URL=https://<render-backend>` (no trailing slash, no `/api` suffix).

## Assumptions and Trade-offs

- SQLite for local dev (zero setup); PostgreSQL in production (Render disk is ephemeral).
- Backend is source of truth; frontend transition map is UX-only.
- Same-status updates rejected (`409`) to keep concurrency deterministic.
- `synchronize:true` only for SQLite dev; Postgres prod uses `synchronize:false`.
- No auth (out of scope); single-table design; no pagination (fine at assignment scale).

## Future Improvements

Auth, pagination/search, job retry, real workers (BullMQ), WebSocket live updates, structured logging, monitoring, Docker, Postgres migrations.

## Deployment Plan (not yet deployed — awaiting confirmation)

Backend (Render, Node 20): Root `backend`, Build `npm install && npm run build`, Start `npm run start:prod`, add Postgres + `DATABASE_URL`, set `FRONTEND_URL` to Vercel URL, verify `/health`, `/jobs`, `/api/docs`, CORS.
Frontend (Vercel): Root `frontend`, Build `npm run build`, Output `dist`, env `VITE_API_URL=https://<render-backend-url>`.
Live URLs: to be added here after deploy (GitHub / frontend / backend / Swagger).
