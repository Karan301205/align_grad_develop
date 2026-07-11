# AlignGrade Admin Portal (`admin_ws`)

This is the standalone Admin Portal for WhiteScholars administrators, running completely independent of the main Student & Recruiter portals.

## Port Assignments
- **Admin Frontend**: `http://localhost:5174`
- **Admin Backend**: `http://localhost:5002`

## Getting Started

1. Install dependencies for both frontend and backend:
   ```bash
   npm run install-all
   ```

2. Run the development workspace:
   ```bash
   npm run dev
   ```

## Folder Structure
- `frontend/`: React + Vite + Tailwind CSS admin UI dashboards.
- `backend/`: Node + Express + WebSocket backend API server.
- `shared/`: Shared permission definitions, constants, and utilities.
- `docs/`: Deployment, architecture, database, and API details.
