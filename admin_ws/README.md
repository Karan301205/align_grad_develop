# AlignGrade Admin Portal (`admin_ws`)

This is the standalone Admin Portal for WhiteScholars administrators, running completely independent of the main Student & Recruiter portals.

## Port Assignments
- **Admin Frontend**: `http://localhost:5174`
- **Admin Backend**: `http://localhost:5002`

## Frontend environment

The admin UI reads its API base from `VITE_ADMIN_API_BASE_URL` (see `frontend/.env.example`).

- Production default (if unset): `https://aligngrad.com/api`
- Local development: copy `frontend/.env.example` to `frontend/.env` and set e.g. `VITE_ADMIN_API_BASE_URL=http://localhost:5002/api`

Vite inlines this value at build time, so production deploys must set it before `npm run build` in `frontend/`.

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
