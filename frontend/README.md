# Frontend — Mini Job Queue Dashboard

React + Vite + TypeScript + Tailwind CSS dashboard for the NestJS job queue API.

## Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_URL` to the backend URL (default `http://localhost:3000`, no trailing slash, no `/api` suffix).

## Scripts

- `npm run dev` — local dev server
- `npm run build` — typecheck + production build
- `npm run test` — Vitest suite
- `npm run lint` — oxlint

## API contract used

- `GET /jobs` → `Job[]`
- `POST /jobs {title, type}` → `201 Job`
- `PATCH /jobs/:id/status {status}` → `200 Job`, `409` on invalid/concurrent transition
- `DELETE /jobs/:id` → `204`
- `GET /health`

On `409` the UI shows “This job was updated by another request…” and refetches.
