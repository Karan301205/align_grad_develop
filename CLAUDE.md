# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Memory

**Read `MEMORY.md` first, before doing anything else.** It is the maintained source of truth for this repo: folder responsibilities, per-file purpose/risk/dependencies, the full API map, the DB schema, a task→file search index, and change-frequency hints. Use it to jump straight to the right files instead of scanning the tree. `.agents/rules/rule-1-highest-priority.md` codifies this workflow: identify target files from `MEMORY.md`, open only those files plus their direct dependencies/consumers, and avoid full repository scans unless `MEMORY.md` is missing/outdated, a feature isn't indexed, imports don't resolve, or the user explicitly asks for a full audit. **Update `MEMORY.md` whenever you change the architecture** (new routes, new schema fields, new top-level files).

Note: `MEMORY.md`'s API map is missing endpoints that exist in `backend/src/routes/api.js` — student: `GET /student/tests/skills`, `POST /student/tests/generate`, `POST /student/tests/submit`, `GET /student/applications`, `POST /student/intro-video`, `POST /student/video-upload-url`; recruiter: `PUT /recruiter/jobs/:jobId`, `DELETE /recruiter/jobs/:jobId`, `PUT /recruiter/applications/:applicationId/rounds`. Verify against the actual route file when in doubt, and fix the doc while you're there.

## Commands

### Backend (`backend/`)
```bash
npm run dev     # nodemon src/index.js — dev server on http://localhost:5001
npm start        # node src/index.js — production start
npx prisma generate   # regenerate Prisma client after editing schema.prisma
npx prisma db push    # push schema changes to MongoDB (requires real DATABASE_URL)
```
No test suite or lint script is configured for the backend.

### Frontend (`frontend/`)
```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # production build to frontend/dist
npm run lint      # ESLint (flat config, eslint.config.js)
npm run preview   # preview a production build
```
No test suite is configured for the frontend.

There is no root-level package.json — frontend and backend are independent npm projects and must be installed/run separately.

## Architecture

Full-stack recruitment platform matching candidate self-rated skills against recruiter job requirements, with an MCQ-based skill verification/certification flow that can upgrade a candidate's rating.

- **Frontend**: React 19 SPA (Vite + Tailwind CSS v4), plain JavaScript only — **no TypeScript** in `frontend/`.
- **Backend**: Express REST API, **strictly CommonJS** (`require`, not ES modules).
- **Database**: MongoDB via Prisma ORM (`backend/prisma/schema.prisma`). See `backend/src/config/db.js`.
- **File/video storage**: Supabase Storage, used for resume/intro-video uploads (signed upload URLs generated server-side with the Supabase service-role key).
- **AI question generation**: `generateMcqs()` in `backend/src/controllers/student.controller.js` calls Claude on AWS Bedrock first, and falls back to Groq (Llama 3.1 8B) if Bedrock fails — used by `POST /api/student/tests/generate` to produce 10 MCQs per skill.

### Request flow
```
frontend/src/App.jsx (token/user state, role-based routing)
  ├─ features/Auth/AuthView.jsx           (login/signup)
  ├─ features/SkillTest/TestView.jsx      (remedial quiz UI)
  ├─ features/Student/StudentLayout.jsx   (dashboard, profile, resume, skill tests, showcase)
  └─ features/Recruiter/RecruiterLayout.jsx (jobs, candidates, post job, company verification)
        │  fetch → API_BASE (frontend/src/constants/index.js) → http://localhost:5001/api
        ▼
backend/src/index.js → routes/api.js → middleware/auth.js (JWT) → controllers/* → config/db.js (Prisma or mock) → prisma/schema.prisma
```

### Mock database fallback
`backend/src/config/db.js` wraps `PrismaClient` behind a `Proxy`. If `DATABASE_URL` is unset or points at `localhost`, or if the initial `user.count()` connectivity probe times out (10s), it transparently swaps to an in-memory `mockClient`/`mockDb` that mimics the Prisma API surface (find/create/update per model) and comes pre-seeded with a few demo jobs. This lets the backend run with zero external setup — but the in-memory store resets on every restart and only implements the query shapes the current controllers actually use, so if you add a new Prisma call, add a matching mock method too.

### Auth model
JWT-based; `authMiddleware` (`backend/src/middleware/auth.js`) verifies the Bearer token and sets `req.user` from the decoded payload (`{ id, role, ... }`). There are exactly two roles, `STUDENT` and `RECRUITER`, both stored on `User.role` as plain strings (not an enum) and switched on throughout controllers and `App.jsx`.

### Skill matching & verification
- `ALL_SKILLS` (`frontend/src/constants/index.js`) and `TECHNICAL_SKILLS` (`backend/src/controllers/student.controller.js`) are two independently maintained skill lists — keep them in sync manually when adding/removing skills.
- A `Profile.skills` entry has both `rating` and `verifiedRating`. **As of 2026-07-20 (Decision 1) ratings are server-owned:** a newly declared skill starts at `rating: 1`, candidates cannot self-set/raise ratings (`updateProfile` runs skills through `reconcileSkills`, ignoring client rating values), and the only way a rating rises is a passing server-scored assessment.
- Job matching (`getJobs`/`applyJob` in `student.controller.js`) compares a student's `skills[].rating` against `Job.requirements[].minRating`, case-insensitively by skill name. Falling short blocks the apply action but not the browse/view action.
- **Assessment scoring is server-side (Plan 2, 2026-07-20).** `POST /student/tests/generate` (`generateSkillTest`) builds 10 questions (bank-first, live fallback), stores the answer key in a single-use, 30-min `TestSession`, and returns options-only questions + a `sessionId` (no answer key). `POST /student/tests/submit` (`submitSkillTest`) takes `{sessionId, answers[]}`, scores against the session key in `services/questionBank/scoring.js` (**70% pass**), burns the session, and raises `verifiedRating` only on pass. The legacy `POST /student/tests` (`submitTest`) client-score path is **disabled (410)**. Both former vulnerabilities (client-supplied score, answer key sent to client) are closed.

### Environment variables
- Backend `.env`: `DATABASE_URL` (MongoDB, needs `replicaSet` for Prisma transactions), `JWT_SECRET`, `PORT` (default 5001), plus `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (video storage) and `CLAUDE_API_KEY`/`GROQ_API_KEY` (MCQ generation) referenced by controllers but not present in `.env.example` — check `backend/.env` directly if a feature depending on them isn't working.
- Frontend `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Architecture rules (from MEMORY.md, enforce when editing)
- Frontend: React + JavaScript + Tailwind only. No TypeScript, no external UI/CSS libraries (Material-UI, Bootstrap, etc.) — pure Tailwind.
- Backend: Node.js CommonJS only — no ES6 `import`/`export` syntax.
- Prisma/MongoDB: all queries async/await.
- No UI placeholder text — components must bind to real mock or live data.
