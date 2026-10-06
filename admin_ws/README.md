# AlignGrade Admin Portal (`admin_ws`)

This is the standalone Admin Portal for WhiteScholars administrators, running completely independent of the main Student & Recruiter portals.

## Port Assignments
- **Admin Frontend**: `http://localhost:5174`
- **Admin Backend**: `http://localhost:5002`

## Frontend environment

The admin UI reads its API base from `VITE_ADMIN_API_BASE_URL` (see `frontend/.env.example`).

- Production: must be explicitly set before `npm run build` in `frontend/` (e.g. `VITE_ADMIN_API_BASE_URL=https://<your-admin-domain>/api`). Missing this variable in production raises a build/runtime configuration error.
- Local development: copy `frontend/.env.example` to `frontend/.env` and set `VITE_ADMIN_API_BASE_URL=http://localhost:5002/api`

Vite inlines this value at build time, so production deploys must configure it prior to `npm run build`.

## Getting Started

1. Install dependencies for both frontend and backend:
   ```bash
   npm run install-all
   ```

2. (Optional) Configure the frontend API URL:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

3. Run the development workspace:
   ```bash
   npm run dev
   ```

## Folder Structure
- `frontend/`: React + Vite + Tailwind CSS admin UI dashboards.
- `backend/`: Node + Express + WebSocket backend API server.
- `shared/`: Shared permission definitions, constants, and utilities.
- `docs/`: Deployment, architecture, database, and API details.
