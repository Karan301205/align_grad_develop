# AlignGrade Architecture & Project Memory

This document is the single source of truth for the AlignGrade repository. It defines the folder responsibilities, file mappings, database schema, API routing, dependencies, and rules of development. Future agents should read this file to target specific modifications and bypass full codebase scans.

---

## 1. Project Overview
* **Project Name**: AlignGrade
* **Purpose**: A premium, full-stack recruitment & skill verification platform.
* **Business Objective**: Align candidate self-rated proficiencies with recruiter requirements using automated skill matching. Candidates falling below requirements are locked out from applying but can take interactive certification tests to verify their skills and unlock opportunities.
* **High-Level Architecture**: 
  - **Frontend**: Single Page React Application (Vite + Tailwind CSS v4). Design system: **Architectural Professionalism** (Corporate Minimalist with subtle architectural influences) driven by semantic CSS-variable tokens in `src/styles/index.css` (light + class-based dark mode). Includes Stitch design system tokens (`.ambient-card`, `.material-symbols-outlined`, `surface-container-*`). Light = primary background `#F9F8F6` with stark white surface `#ffffff` layering; dark = deep slate-blue chassis `#0d1526`. Accent (`--c-primary`) is **emerald green `#003527`** (overridden from design system primary blue for active branding), representing institutional success and authorization. Depth is achieved through clean line work, solid offset borders, and tonal layering. Signature elements: smooth modern rounded corners globally (`--radius-*`), sharp 1px/2px solid borders (`#0f172a`), flat offset shadow configurations. Typography is strictly standardized to a clean two-font system across both main frontend and `admin_ws`:
    - **Inter @ weight 500** (`'Inter', sans-serif` via `font-headline font-medium` and `h1..h6` base rules) for all main headings, big headings, subheadings, section headers, form labels, tabs, and status badges/pills.
    - **Geist @ weight 400** (`'Geist', sans-serif` via `font-sans font-normal` and body base rules) for all descriptions, body text, paragraph content, inputs, selects, textareas, and data values.
    - Monospace fonts (`JetBrains Mono`, `ui-monospace`, `monospace`) and system font fallbacks (`BlinkMacSystemFont`, `-apple-system`) are strictly eliminated across the repository; `--font-mono` is mapped directly to `'Geist', sans-serif`. Cards/inputs restyled centrally in `src/components/ui/` — feature views inherit the style through those primitives + tokens (no per-feature restyling).
  - **Backend**: Express.js REST API using CommonJS (`require` syntax).
  - **Database & ORM**: MongoDB + Prisma ORM. Auto-configures an in-memory mock database store for seamless offline execution if no MongoDB connection is configured.

---

## 2. Folder Structure

Below is the complete, comprehensive directory structure of the AlignGrade project (excluding local `node_modules` and compiled build outputs):

```
.
├── AlignGrade_Scale_Plan.md      # Strategy document outlining scaling stages & refactoring paths
├── CLAUDE.md                     # Local development guidelines, lint commands, and dev instructions
├── MEMORY.md                     # Single source of truth for repository state & file maps (this file)
├── README.md                     # Root project overview and initialization guide
├── a_g_l Background Removed.png  # Asset: Primary AlignGrade branding logo (transparent background)
├── auth.txt                      # Developer scratchpad / testing session authorization notes
├── commit.md                     # Summary of recent git commit activities
├── HANDOFF_TEMP_QUESTION_BANK.md # Run-book for temporary question bank shim
├── my_resume.pdf                 # Asset: Sample PDF resume for student upload testing
│   # NOTE: there is NO root-level package.json. frontend/ and backend/ are
│   # independent npm projects and must be installed/run separately.
│
├── docs/                         # System and domain documentation
│   ├── api/                      # OpenAPI specifications and endpoint docs
│   ├── architecture/             # High-level design and module boundaries
│   ├── database/                 # Prisma schemas, Atlas migrations, mock store notes
│   ├── deployment/               # Cloud architecture, CI/CD, and scaling plans
│   └── superpowers/              # Feature design specs, archives, and migration plans
│
├── backend/                      # --- Main Express.js API Workspace (Port 5001) ---
│   ├── prisma/
│   │   └── schema.prisma         # Prisma schema and MongoDB collection structure definitions
│   ├── scripts/                  # Offline generation, validation, and database seeding scripts
│   ├── src/
│   │   ├── config/               # Legacy re-export shims & configuration files (db.js, s3.js, env.js, rateLimit.config.js, upload.config.js)
│   │   ├── cli/                  # Operator CLI (npm run bank -- <command>)
│   │   ├── middleware/           # HTTP Interceptors (auth.js, errorHandler.js, rateLimiter.js, validate.js)
│   │   ├── routes/
│   │   │   ├── index.js          # Thin route aggregator mounting domain modules
│   │   │   └── api.js            # Backwards-compatible route re-export shim
│   │   ├── infrastructure/       # Core low-level I/O and external integrations
│   │   │   ├── database/         # Prisma Client proxy & hot-swapping mock database
│   │   │   │   ├── index.js      # Primary DB export ({ prisma, isMock, initDb })
│   │   │   │   └── mock/         # In-memory sandbox DB store (mockClient.js, seed.js, loadQuestionBankMock.js)
│   │   │   ├── storage/s3/       # AWS S3 client builder, presigned URLs, and uploadBuffer helper
│   │   │   ├── ai/               # AI LLM providers (bedrockProvider.js, groqProvider.js)
│   │   │   └── logging/          # Centralized logger adapter
│   │   ├── shared/               # Cross-cutting utilities & helpers
│   │   │   └── utils/
│   │   │       └── fileSignature.js # Binary magic-bytes validator
│   │   ├── modules/              # Domain-oriented feature modules
│   │   │   ├── auth/             # Authentication & token issuance (controller, routes, validator, index)
│   │   │   ├── students/         # Student profiles, applications, video showcase (controller, routes, validator, index)
│   │   │   ├── recruiters/       # Recruiter profiles, company verification, talent search (controller, routes, validator, index)
│   │   │   ├── jobs/             # Job lifecycle, listings, requirements (jobLifecycle.service, index)
│   │   │   ├── gigs/             # Gigs freelance marketplace (controller, routes, validator, index)
│   │   │   ├── assessments/      # Skill assessments & pre-generated question bank
│   │   │   │   ├── mcq/          # AI prompt builders & MCQ service
│   │   │   │   └── question-bank/ # Selection, scoring, repositories, health, CLI tools
│   │   │   ├── skills/           # Technical skills taxonomy & match scoring engine (technicalSkills.js, skillMatching.service.js, index)
│   │   │   ├── uploads/          # Presigned upload URLs & S3 file cleanup (controller, routes, validator, fileCleanup.service, index)
│   │   │   └── community/        # Community networks, feeds, posts, reactions, comments (controller, routes, validator, services/, index)
│   │   └── index.js              # Application entrypoint setting up Express, DB, and mounting /api routes
│   ├── package.json
│   ├── package-lock.json
│   └── nodemon.json
│
├── frontend/                     # --- Main React + Vite Client Workspace (Port 5173) ---
│   ├── public/                   # Static assets (logos, icons, illustrations)
│   ├── src/
│   │   ├── app/
│   │   │   └── App.jsx           # Main application coordinator & route view state controller
│   │   ├── styles/
│   │   │   ├── index.css         # Main design system & token definitions (Tailwind v4)
│   │   │   └── App.css           # Global resets and container configurations
│   │   ├── main.jsx              # Client mounting layer rendering App into DOM
│   │   ├── components/           # Reusable generic UI elements & cross-cutting modals
│   │   │   ├── CompanyProfileModal.jsx
│   │   │   ├── ConnectionLoader.jsx
│   │   │   ├── EmeraldSignupToast.jsx # Emerald slide-in notification for unauthenticated redirects
│   │   │   ├── JobDetailsModal.jsx
│   │   │   ├── ResumePdfTemplate.jsx # Standardized A4 printable candidate resume template
│   │   │   └── ui/               # Atomic Neumorphic primitives (Button, Card, Input, Badge, etc.)
│   │   ├── features/             # Domain-oriented frontend features
│   │   │   ├── auth/             # Auth pages & views (AuthView, CandidateAuth, RecruiterAuth, index)
│   │   │   ├── student/          # Student portal (pages/StudentLayout, components/, index)
│   │   │   ├── recruiter/        # Recruiter portal (pages/RecruiterLayout, components/, index)
│   │   │   ├── gigs/             # Freelance marketplace (pages/GigsMarketplace, components/GigCard, GigFilterSidebar, GigDetailPage, gigConstants, index)
│   │   │   ├── skill-test/       # Skill certification exam (pages/TestView, index)
│   │   │   └── community/        # Community network & feed (pages/CommunityLayout, components/, index)
│   │   ├── config/               # Client runtime configuration
│   │   ├── constants/            # Client lookup options & skill lists
│   │   ├── services/             # Client API fetchers & upload services
│   │   └── utils/                # Error formatters & profile completeness calculators
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
└── admin_ws/                     # --- Isolated Admin Portal Workspace (Independent Project) ---
    ├── backend/                  # Administrative Backend Express Server (Port 5002)
    │   ├── server.js             # Starts server and listeners
    │   ├── app.js                # Express app mounting modular admin routes
    │   ├── src/
    │   │   ├── config/           # DB connection, env, s3, and rateLimit configs
    │   │   ├── middleware/       # Admin auth, error handling, rate limiting
    │   │   ├── modules/          # Domain-oriented admin modules
    │   │   │   ├── auth/         # Admin login & token generation (controller, routes, index)
    │   │   │   ├── dashboard/    # Executive summary metrics & stats (controller, routes, index)
    │   │   │   ├── students/     # Student accounts & verification stats (controller, routes, index)
    │   │   │   ├── recruiters/   # Recruiter accounts & company trust status (controller, routes, index)
    │   │   │   ├── jobs/         # Job listings audit & validation (controller, routes, validator, index)
    │   │   │   ├── analytics/    # Skill supply vs demand analytics (controller, routes, index)
    │   │   │   └── storage/      # MongoDB Atlas & S3 storage metrics & billing estimates (controller, routes, services/, index)
    │   │   ├── utils/            # Admin helpers (formatBytes.js)
    │   │   └── mocks/            # Fallback mocks for offline admin operations
    │   └── package.json
    └── frontend/                 # Administrative React Client Dashboard (Port 5174)
        ├── src/
        │   ├── app/
        │   │   └── App.jsx       # Main admin dashboard layout coordinator
        │   ├── styles/
        │   │   └── index.css     # Admin dashboard appearance styling
        │   ├── main.jsx          # Admin DOM mount
        │   └── api/
        │       └── adminApi.js   # Admin API fetch client
        └── package.json
```

---

## 3. File Responsibilities

### Backend Files (`backend/`)

### Modular Domain Architecture (`backend/src/modules/`, `infrastructure/`, `shared/`)

As part of the pure architectural refactoring (completed on branch `file_restructure`), the backend is organized into a clean domain-oriented modular architecture while maintaining 100% functional parity and preserving backwards-compatible shims for all existing entry points:

1. **Infrastructure Layer (`backend/src/infrastructure/`)**:
   - `database/`: Database client wrapper (`index.js` exporting `{ prisma, isMock, initDb }`), handling dynamic mock fallback and connection pooling. Sandbox fixtures and in-memory mock client reside under `mock/` (`mockClient.js`, `seed.js`, `loadQuestionBankMock.js`).
   - `storage/s3/`: AWS S3 client instantiation, presigned upload URLs generator, and buffer uploader.
   - `ai/`: Unified LLM provider implementations (`bedrockProvider.js`, `groqProvider.js`).
   - `logging/`: Centralized logger adapter and structured diagnostics.

2. **Shared Utilities Layer (`backend/src/shared/`)**:
   - `utils/fileSignature.js`: Magic bytes validation enforcing strict binary MIME checking.

3. **Domain Modules (`backend/src/modules/`)**:
   - `auth/`: User signup, login, Google OAuth verification, token issuance (`auth.controller.js`, `auth.validator.js`, `auth.routes.js`, `index.js`).
   - `students/`: Candidate profile management, applications submission, video showcase (`student.controller.js`, `student.validator.js`, `student.routes.js`, `index.js`).
   - `recruiters/`: Recruiter authentication, company verification, talent search, job management (`recruiter.controller.js`, `recruiter.validator.js`, `recruiterCompany.validator.js`, `recruiter.routes.js`, `index.js`).
   - `jobs/`: Job lifecycle, expiration management (`jobLifecycle.service.js`, `index.js`).
   - `gigs/`: Freelance gigs marketplace, bids, hiring, deliverables, messaging (`gig.controller.js`, `gig.validator.js`, `gig.routes.js`, `index.js`).
   - `assessments/`: Skill assessment generation, test session scoring, question-bank subsystem (`mcq/`, `question-bank/`, `index.js`).
   - `skills/`: Technical skills registry and match scoring engine (`technicalSkills.js`, `skillMatching.service.js`, `index.js`).
   - `uploads/`: Presigned upload URL generation and S3 file cleanup (`upload.controller.js`, `upload.validator.js`, `fileCleanup.service.js`, `upload.routes.js`, `index.js`).
   - `community/`: LinkedIn-style feed, multi-media posts, nested comments, reactions, bookmarks (`community.controller.js`, `community.validator.js`, `community.routes.js`, `services/`, `index.js`).

4. **Route Aggregator (`backend/src/routes/index.js`)**:
   - Thin aggregator mounting all domain routes under identical URI namespaces: `/api/auth`, `/api/student`, `/api/recruiter`, `/api/upload`, `/api/gigs`, `/api/community`.
   - `backend/src/routes/api.js` re-exports `backend/src/routes/index.js` for backwards compatibility.

#### [backend/prisma/schema.prisma](file:///Users/karanrawat/Desktop/a_g/backend/prisma/schema.prisma)
* **Purpose**: Prisma ORM schema definitions for MongoDB structures. Sets up data collections (User, Profile, Company, Job with `showSalary Boolean? @default(true)`, Application, TestAttempt, **SkillDefinition**, **Question**, **TestSession**, **AssessmentRecord**, **SkillRoadmap**, **Gig** with `currency String @default("INR")`, `logo String?`, `category String?`, `categories String[] @default([])`, and `hiredCandidateIds String[] @default([])` for multi-candidate hiring) and their relationships.
* **`SkillDefinition` (added 2026-07-18)**: canonical registry for skill identity — `canonicalName`, `slug` (unique), `aliases[]`, `category`, `tier` (1|2|3), `status`, `targetQuestionCount`, `counters` (embedded `SkillCounters`), `createdAt/updatedAt/deletedAt`. Indexed on `[tier, status]`. Status values are plain strings (`WAITING | GENERATING | PAUSED | REVIEWING | COMPLETED | PUBLISHED`), matching the existing `User.role` convention rather than a Prisma enum. **(The `status` lifecycle values, `counters`/`SkillCounters`, and `targetQuestionCount` are legacy from the deprecated enterprise pipeline — see §19; only `canonicalName`/`slug`/`aliases`/`category`/`tier` are actively used.)**
* **CRITICAL naming constraint**: the model is `SkillDefinition`, **never `Skill`**. `type Skill { name, rating, verifiedRating }` already exists as the embedded type on `Profile.skills`; declaring `model Skill` is a duplicate declaration and fails client generation.
* **`Question` (added 2026-07-20, interim question bank)**: pre-generated MCQ store — `skillName`, `subtopic`, `question`, `options[]`, `correctIndex` (0-3 server-side answer key, aligned with Plan 2's `TestSession`), `source`, `createdAt`; indexed on `[skillName]`. Seeded offline by `scripts/seedQuestions.js` from `scripts/generateQuestions.js` (Groq `llama-3.3-70b-versatile`) output at `scripts/output/questions.json` (500 Qs, 10 skills × 50). **Phase 4 (2026-07-23) — assessment integration & usage tracking:** `generateSkillTest` now serves **strictly from the bank** (no live fallback — the `mcqService.generate` path was removed). Selection goes through `services/questionBank/selection.js` (pure, seeded → deterministic/testable): ACTIVE-only, distributed across subtopics (round-robin), balanced difficulty per config (`DEFAULT_DIFFICULTY_MIX`), no duplicates. `services/questionBank/repositories/questionRepository.js` is the sole assessment-path Question access — `findActiveBySkill`, `recordServed` (atomic `usageCount +1` + `lastUsed`), `recordOutcomes` (atomic `correctCount`/`wrongCount`/`skipCount`). All counter writes use Mongo atomic `$inc` (Prisma `{ increment }`) so concurrent assessments never overwrite. The bank auto-loads into the mock from `scripts/output/questionBank.json` via `config/mock/loadQuestionBankMock.js` at boot (`npm run dev:mock`). **Prod prerequisite:** the ~4,770-question bank must be seeded into Atlas (human step; see CONTINUATION) before real-DB assessments work — `prisma.question.findMany` returns empty otherwise. **Phase 5 (2026-07-23) — intelligence & maintenance:** selection is now **usage-aware** (`selection.orderByUsage`: least-used first, seeded tiebreak) so traffic spreads across the bank. Health is evaluated by `services/questionBank/health.js` (pure `evaluateHealth`/`classify`) against configurable rules in `healthConfig.js` → categories Healthy | Needs Review | Replacement Candidate | Retired. `services/questionBank/maintenance.js` `runHealthReview` (CLI `npm run bank -- health-review [--commit]`) FLAGS questions via `Question.reviewState` (`NONE | NEEDS_REVIEW | REPLACEMENT_CANDIDATE`) + `lastReviewed` — flag-only, never regenerates/deletes/alters counters; a flagged question stays `status=ACTIVE` and served until a replacement is approved (later phase). New `Question.reviewState` field + index. **Phase 6 (2026-07-23) — production readiness:** `scripts/seedQuestionBank.js` (`npm run bank:seed [-- --commit]`) seeds the bank into the DB — dry-run default, validates every record, idempotent/resumable (dedup by skillName+subtopic+normalized text), batched, graceful per-run rollback; HUMAN-run for prod, never from an agent. `scripts/verifyQuestionBank.js` (`npm run bank:verify`) produces an integrity report (canonical skill/roadmap/subtopic/orphan/dup-id/dup-in-subtopic/metadata/difficulty/reviewState) — verified clean on all 4,770. `scripts/loadTestQuestionBank.js` (`npm run bank:loadtest`) load-tests concurrency (300 assessments: 0 errors, exact atomic counters, gen ~7ms/submit ~8ms). Added `@@index([skillName, status])` for the selection hot path. Standardized non-sensitive logs (`[assessment]`, `[health-review]`, `[qbank-seed]`, `[qbank-verify]`). Added `@@index([skillName, status])`. **DEPLOYED TO PRODUCTION ATLAS 2026-07-23 (one-time, user-authorized override of the never-write-prod rule):** 143 SkillDefinitions, 36 SkillRoadmaps, and 4,770 bank questions seeded; integrity verify = ALL CHECKS PASSED. Fixed a latent prod bug found during seeding — 15 legacy interim-bank questions (12 Python + 3 Java) had `updatedAt: null` which broke every full `prisma.question.findMany()` (would have failed `findActiveBySkill` at runtime); they were repaired (timestamp set) then RETIRED (off-roadmap "Fixtures" subtopics), so the servable bank is exactly 4,770 ACTIVE. `seedQuestionBank.js`/`verifyQuestionBank.js` now use `select` on reads (efficient + robust to null-timestamp legacy rows). Prod totals: 4,785 questions (4,770 ACTIVE + 15 RETIRED).
* **`TestSession` (added 2026-07-20, Plan 2 — security fix; `questionIds` added Phase 4)**: server-side assessment session — `userId`, `skillName`, `answerKey Int[]` (correct option index per served question), `questionIds String[]` (served Question ids, parallel to `answerKey` — lets `submitSkillTest` attribute per-question correct/wrong/skip), `used Bool`, `score Int?`, `passed Bool?`, `expiresAt`; indexed on `[userId]`. **Phase 4 integrity:** `submitSkillTest` no longer returns the answer key — it returns `results: [{correct}]` (per-question booleans only); explanations, usage stats, metadata, and internal ids are never exposed. Skip is detected server-side (missing answer or `-1` sentinel); the current UI defaults unanswered to `0`, so `skipCount` stays unexercised until the UI sends the sentinel.
* **`AssessmentRecord` (added 2026-07-23, Phase 5 analytics)**: one immutable row per completed assessment, written by `submitSkillTest` — `candidateId`, `skill`, `questionIds[]`, `startedAt` (= session createdAt), `endedAt`, `totalQuestions`, `correctAnswers`, `wrongAnswers`, `skippedQuestions`, `finalScore`, `passed`; indexed on `[candidateId]` and `[skill]`. Append-only, never deleted (preserves assessment history); the older `TestAttempt` is kept alongside. Sole access: `services/questionBank/repositories/assessmentRepository.js` (`record`/`findByCandidate`). Feeds future recruiter reporting — no dashboard built yet. Sole Prisma access: `services/questionBank/repositories/testSessionRepository.js` (`create`/`findValidForUser`/`markUsed`). **This closes both skill-verification holes:** `generateSkillTest` now stores the answer key in a session and returns `{sessionId, questions:[{id,question,options}]}` with NO answers; `submitSkillTest` takes `{sessionId, answers[]}`, scores server-side via pure `services/questionBank/scoring.js` (`scoreAnswers`, 70% pass threshold for verified badge), burns the single-use session. Regardless of whether 70% is passed, the candidate's current rating is updated to reflect their test score (e.g. 40% = Level 4/10 unverified; 80% = Level 8/10 verified). The client never sends a score. **Skill Self-Rating Constraints:** candidates cannot self-rate skills for which active MCQ tests exist (starts at 1/10 without dropdown); only untestable technical skills (no quiz in bank) and soft skills can be self-rated (1–10). `updateProfile` runs skills through `reconcileSkills(skills, existing, skillsWithMCQs)` to enforce this server-side. The legacy `POST /student/tests` (`submitTest`) is disabled (410).
* **`SkillRoadmap` (added 2026-07-21, Phase 2)**: per-skill interview roadmap — `skillName` (unique, canonical), `popularityRank` (1 = highest hiring demand), `subtopics[]` (ordered foundational→advanced, 10-15), `createdAt`, `updatedAt`; indexed on `[popularityRank]`. One row per canonical registry skill (aliases excluded). Generated offline by `scripts/generateRoadmaps.js` (provider chain Claude/Bedrock → Groq) in the order set by `scripts/skillRanking.json`, persisted immediately + resumably to `scripts/output/roadmaps.json`, seeded via `scripts/seedRoadmaps.js` (dry-run default, `--commit` human-only, idempotent upsert by `skillName`). Mock support in `mockClient.js`/`seed.js`. **Status: 143/143 generated + verified (avg 13.3 subtopics).** This is the blueprint that will drive Phase 3 question generation. **No MCQs are stored here.**
* **`Profile` has no `deletedAt` field.** Do not add `where: { deletedAt: null }` to Profile queries — Prisma rejects it with `Unknown argument`.
* **Used By**: Prisma client generator command.
* **Dependencies**: MongoDB server (connection specified in env).
* **Safe Modifications**: Appending new fields or schemas to models. Ensure type declarations match MongoDB constraints.
* **Risk**: High (requires database migration/sync and client regeneration).

#### [backend/src/index.js](file:///Users/karanrawat/Desktop/a_g/backend/src/index.js)
* **Purpose**: Primary backend bootstrapper. Instantiates the Express application, sets up global middlewares (CORS, JSON parsers, limits), registers raw body handlers for secure binary uploads, binds routing modules, and starts listening on the designated PORT.
* **Used By**: Root `npm run start` and `nodemon` scripts.
* **Dependencies**: `express`, `cors`, `dotenv`, [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Safe Modifications**: Registering new global middlewares, altering startup logging formats.
* **Risk**: High (crashes block all client API communication).

#### [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js)
* **Purpose**: Main routing map. Registers all endpoint namespaces (Auth, Student, Recruiter, Upload), binds validator schemas, attaches authorization guards, and routes traffic to the appropriate controllers.
* **Used By**: [backend/src/index.js](file:///Users/karanrawat/Desktop/a_g/backend/src/index.js).
* **Dependencies**: `express.Router`, middlewares, validators, controllers.
* **Safe Modifications**: Exposing new endpoint URLs, updating validation sequences.
* **Risk**: Medium.

#### [backend/src/middleware/auth.js](file:///Users/karanrawat/Desktop/a_g/backend/src/middleware/auth.js)
* **Purpose**: Intercepts requests with JWT authorization headers, validates token integrity against `JWT_SECRET`, extracts the payload, and appends the decoded user context to the request object.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `jsonwebtoken`, `backend/src/config/env.js`.
* **Safe Modifications**: Formatting error response payloads, customizing token format parser.
* **Risk**: High (controls endpoint security and identity propagation).

#### [backend/src/middleware/errorHandler.js](file:///Users/karanrawat/Desktop/a_g/backend/src/middleware/errorHandler.js)
* **Purpose**: Captures unhandled runtime errors in Express route handlers, formats error responses to JSON, and prints diagnostics logs to console. Shields raw stack traces and database schemas in production mode with a generic message.
* **Used By**: [backend/src/index.js](file:///Users/karanrawat/Desktop/a_g/backend/src/index.js).
* **Dependencies**: None.
* **Safe Modifications**: Adjusting logging formats, custom mappings for specific exception classes.
* **Risk**: Low.

#### [backend/src/middleware/rateLimiter.js](file:///Users/karanrawat/Desktop/a_g/backend/src/middleware/rateLimiter.js)
* **Purpose**: Restricts requests using in-memory state tracking to prevent brute-force attacks and DDOS traffic. Manages locks on consecutive authentication failures with progressive exponential backoffs.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: [backend/src/config/rateLimit.config.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/rateLimit.config.js).
* **Safe Modifications**: Editing time-window frames, formatting locked message blocks.
* **Risk**: Medium (strict configurations might block legitimate users).

#### [backend/src/middleware/validate.js](file:///Users/karanrawat/Desktop/a_g/backend/src/middleware/validate.js)
* **Purpose**: Validates incoming request payloads (body, query, params) against Zod schemas. Aborts invalid requests early with detailed field errors and HTTP 400.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: Structuring response formats for client-friendly validation rendering.
* **Risk**: Medium.

#### [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js)
* **Purpose**: DB interface module. Initializes PrismaClient, exports `{ prisma, isMock, initDb }`, runs connection checks to MongoDB, and automatically hot-swaps to the local sandbox database client if database configurations are unavailable or invalid (e.g. DNS resolution failure or network timeout). `initDb()` allows `src/index.js` to await DB status resolution on boot before initializing mock stores and dependent services.
* **Used By**: All backend controllers, [backend/src/index.js](file:///Users/karanrawat/Desktop/a_g/backend/src/index.js).
* **Dependencies**: `@prisma/client`, [backend/src/config/mock/mockClient.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/mock/mockClient.js).
* **Safe Modifications**: Editing connection timeouts, tweaking logging parameters.
* **Risk**: High (essential database access gateway).

#### [backend/src/config/env.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/env.js)
* **Purpose**: Centralized environment loader. Imports env keys, parses values, and runs validation checks on system boot. Triggers a fail-fast crash if mandatory production keys (JWT_SECRET, DATABASE_URL, etc.) are missing.
* **Used By**: All backend files referencing `process.env`.
* **Dependencies**: `dotenv`.
* **Safe Modifications**: Adding new environment keys, defining custom fallback rules for local development.
* **Risk**: High (crashes server on startup if variables are incorrectly configured).

#### [backend/src/config/rateLimit.config.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/rateLimit.config.js)
* **Purpose**: Holds default threshold configurations for auth, public, and private rate limiting blocks.
* **Used By**: [backend/src/middleware/rateLimiter.js](file:///Users/karanrawat/Desktop/a_g/backend/src/middleware/rateLimiter.js).
* **Dependencies**: None.
* **Safe Modifications**: Adjusting maximum request attempts, setting time-window rates.
* **Risk**: Low.

#### [backend/src/config/s3.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/s3.js)
* **Purpose**: Initializes the AWS S3 client using environment credentials and provides buffer upload helpers.
* **Used By**: [backend/src/controllers/upload.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/upload.controller.js), [backend/src/services/fileCleanup.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/fileCleanup.service.js).
* **Dependencies**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
* **Safe Modifications**: Modifying cache settings, appending customized header parameters.
* **Risk**: Medium (broken configurations disable resume/video uploads).

#### [backend/src/config/upload.config.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/upload.config.js)
* **Purpose**: Consolidates maximum file size constraints and allowed MIME lists for file types (resumes, logos, videos).
* **Used By**: [backend/src/controllers/upload.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/upload.controller.js).
* **Dependencies**: None.
* **Safe Modifications**: Adding new file extensions, increasing upload limits.
* **Risk**: Low.

#### [backend/src/config/mock/mockClient.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/mock/mockClient.js)
* **Purpose**: Emulates standard Prisma Client collection endpoints (findMany, findUnique, create, update, delete) in-memory using an object model, supporting offline functionality.
* **Used By**: [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js).
* **Dependencies**: [backend/src/config/mock/seed.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/mock/seed.js).
* **Safe Modifications**: Simulating additional Prisma APIs, adding custom relation filters.
* **Risk**: Medium.

#### [backend/src/config/mock/seed.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/mock/seed.js)
* **Purpose**: Declares structures, mock objects, and baseline state values for offline student, recruiter, and job listings.
* **Used By**: [backend/src/config/mock/mockClient.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/mock/mockClient.js).
* **Dependencies**: None.
* **Safe Modifications**: Appending additional mock profiles, modifying skill scores.
* **Risk**: Low.

#### [backend/src/config/mock/loadQuestionBankMock.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/mock/loadQuestionBankMock.js)
* **Purpose**: Helper function that reads offline generated questions from JSON and seeds them into the mock client database at boot.
* **Used By**: [backend/src/index.js](file:///Users/karanrawat/Desktop/a_g/backend/src/index.js).
* **Dependencies**: [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js), `fs`, `path`.
* **Safe Modifications**: Adjusting logs, changing JSON source path.
* **Risk**: Low.

#### [backend/src/constants/technicalSkills.js](file:///Users/karanrawat/Desktop/a_g/backend/src/constants/technicalSkills.js)
* **Purpose**: Provides a unified list of verified technical skills recognized by the alignment matching engine.
* **Used By**: [backend/src/services/skillMatching.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/skillMatching.service.js).
* **Dependencies**: None.
* **Safe Modifications**: Adding/removing technical skill strings.
* **Risk**: Low.

#### [backend/src/controllers/auth.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/auth.controller.js)
* **Purpose**: Express controllers managing user registrations, password hashing checks, credential validations, Google OAuth authentication (`googleAuth` verifying Google JWT ID tokens via `oauth2.googleapis.com/tokeninfo` and auto-provisioning candidate profiles or recruiter companies), and signing new JWT session tokens.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js), `bcryptjs`, `jsonwebtoken`.
* **Safe Modifications**: Customizing login session lifetimes, tweaking error message labels.
* **Risk**: High (handles login credentials).

#### [backend/src/controllers/recruiter.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/recruiter.controller.js)
* **Purpose**: Express controllers managing recruiter profiles, company verification requests, posting new opportunities (with `joiningMonth`, title, requirements, description, rounds), listing active jobs, updating job specifications (including `joiningMonth`), and candidate directory reviews.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js), [backend/src/services/fileCleanup.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/fileCleanup.service.js).
* **Safe Modifications**: Modifying company info fields, customizing sorting rules for applicant lists.
* **Risk**: High.

#### [backend/src/controllers/student.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/student.controller.js)
* **Purpose**: Express controllers managing student profiles, matching listings, applications submission, video intro uploads, and grading certification quizzes.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: Controllers delegate calculations to [backend/src/services/skillMatching.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/skillMatching.service.js), expired postings checks to [backend/src/services/jobLifecycle.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/jobLifecycle.service.js), S3 cleaners to [backend/src/services/fileCleanup.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/fileCleanup.service.js), and AI MCQ test setups to [backend/src/services/mcq/mcqService.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/mcq/mcqService.js).
* **Safe Modifications**: Editing grading score boundaries, updating profile return formats.
* **Risk**: High.

#### [backend/src/controllers/upload.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/upload.controller.js)
* **Purpose**: Manages file uploads. Accepts file details, processes raw uploads into memory, validates binary signatures (magic bytes) to verify correct MIME extensions, and uploads correct binaries to AWS S3.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: [backend/src/config/s3.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/s3.js), [backend/src/config/upload.config.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/upload.config.js), [backend/src/utils/fileSignature.js](file:///Users/karanrawat/Desktop/a_g/backend/src/utils/fileSignature.js).
* **Safe Modifications**: Structuring folder paths inside buckets.
* **Risk**: High (handles uploads logic and executes signature checks).

#### [backend/src/controllers/gig.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/gig.controller.js)
* **Purpose**: Manages gigs marketplace lifecycle including gig creation, applications submission, candidate selection (hiring), private chat messages, deliverables submission, completion acceptance/revisions, and client-freelancer reviews. Pushes completed gigs to candidate profiles as verified work experience.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js).
* **Safe Modifications**: Tweaking review/rating boundaries, customizing private chat text templates.
* **Risk**: Medium.

#### [backend/src/services/fileCleanup.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/fileCleanup.service.js)
* **Purpose**: Provides deletion helpers to remove outdated profile files or company verification papers from S3.
* **Used By**: [backend/src/controllers/student.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/student.controller.js), [backend/src/controllers/recruiter.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/recruiter.controller.js).
* **Dependencies**: [backend/src/config/s3.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/s3.js).
* **Safe Modifications**: Customizing deletion log statements.
* **Risk**: Medium (failed deletions accumulate storage costs).

#### [backend/src/services/jobLifecycle.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/jobLifecycle.service.js)
* **Purpose**: Tracks active days and automatically sets expired tags on job items.
* **Used By**: [backend/src/controllers/student.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/student.controller.js).
* **Dependencies**: [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js).
* **Safe Modifications**: Adjusting default expiration days.
* **Risk**: Medium.

#### [backend/src/services/skillMatching.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/skillMatching.service.js)
* **Purpose**: Analyzes student skill scores against job requirements to flag eligibility and compute missing requirements. Enforces effective rating thresholds (`effectiveRating = verifiedRating > 0 ? verifiedRating : rating >= minRating`) for application gating when MCQs exist in the Question Bank; skills without MCQs generated yet are marked as auto-verified for now so candidates are not blocked. `getRequirementStatuses` returns detailed status flags (`VERIFIED_BY_TEST`, `MET_BY_RATING`, `AUTO_VERIFIED_NO_QUIZ`, `UNVERIFIED`, `MISSING_FROM_PROFILE`). Also powers the **Recruiter Demand Profile recommendation engine**:
  - `buildRecruiterDemandProfile(activeJobs)`: Aggregates required skill ratings across active jobs without treating missing skills as 0, computes skill frequency across active jobs (`frequency = jobCount / totalActiveJobs`).
  - `calculateRecruiterCandidateMatch(demandProfile, profile)`: Compares candidate skills against the demand profile using canonical normalization. Evaluates skill-level similarity (capped at 1.0 per skill so over-qualification cannot compensate for missing skills), required-skill coverage, and skill frequency weights. Missing skills reduce coverage without excluding candidates. Unrelated candidate skills cannot compensate for missing required skills.
  - `getTopMatchingTalents(activeJobs, candidateProfiles, limit)`: Orchestrates demand profile derivation, scores all candidates, and ranks them by `matchScore` descending and verified skill count.
* **Used By**: [backend/src/controllers/student.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/student.controller.js), [backend/src/modules/recruiters/recruiter.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/modules/recruiters/recruiter.controller.js).
* **Dependencies**: [backend/src/constants/technicalSkills.js](file:///Users/karanrawat/Desktop/a_g/backend/src/constants/technicalSkills.js), [backend/src/modules/assessments/question-bank/skills/registryCache.js](file:///Users/karanrawat/Desktop/a_g/backend/src/modules/assessments/question-bank/skills/registryCache.js).
* **Safe Modifications**: Modifying eligibility logic (e.g. adding relaxed match rules for certifications) or adjusting similarity/coverage weighting parameters.
* **Risk**: High (determines candidate job matching and recruiter recommendations).

#### [backend/src/services/mcq/mcqService.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/mcq/mcqService.js)
* **Purpose**: Orchestrates the LLM query sequence for multiple choice questions, querying Bedrock first and falling back to Groq if needed.
* **Used By**: [backend/src/controllers/student.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/student.controller.js).
* **Dependencies**: Providers, [backend/src/services/mcq/prompts.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/mcq/prompts.js).
* **Safe Modifications**: Adding additional fallback steps, modifying fallback error limits.
* **Risk**: Medium.

#### [backend/src/services/mcq/prompts.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/mcq/prompts.js)
* **Purpose**: Declares string instruction templates that tell the LLM how to format JSON output for technical quizzes.
* **Used By**: [backend/src/services/mcq/mcqService.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/mcq/mcqService.js).
* **Dependencies**: None.
* **Safe Modifications**: Refining guidelines, adjusting constraints (like difficulty tags, questions count).
* **Risk**: Low.

#### [backend/src/services/mcq/providers/bedrockProvider.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/mcq/providers/bedrockProvider.js)
* **Purpose**: Submits requests to AWS Bedrock runtime using LLM SDK keys.
* **Used By**: [backend/src/services/mcq/mcqService.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/mcq/mcqService.js).
* **Dependencies**: `@aws-sdk/client-bedrock-runtime`, credentials in env.
* **Safe Modifications**: Switching the model ID, editing token lengths.
* **Risk**: Medium.

#### [backend/src/services/mcq/providers/groqProvider.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/mcq/providers/groqProvider.js)
* **Purpose**: Integrates the Groq API model (via fetch calls) as a fallback question generation engine.
* **Used By**: [backend/src/services/mcq/mcqService.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/mcq/mcqService.js).
* **Dependencies**: Groq API key in env.
* **Safe Modifications**: Updating LLM parameters (temperature, model name).
* **Risk**: Medium.

#### [backend/src/utils/fileSignature.js](file:///Users/karanrawat/Desktop/a_g/backend/src/utils/fileSignature.js)
* **Purpose**: Helper functions checking file buffers for valid magic-bytes matching expected MIME configurations.
* **Used By**: [backend/src/controllers/upload.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/upload.controller.js).
* **Dependencies**: None.
* **Safe Modifications**: Adding new binary signature definitions.
* **Risk**: Medium (incorrect byte strings will block valid files).

#### [backend/src/validators/auth.validator.js](file:///Users/karanrawat/Desktop/a_g/backend/src/validators/auth.validator.js)
* **Purpose**: Zod validation schemas verifying register and login structures (email string check, password length).
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: Increasing password security constraints.
* **Risk**: Low.

#### [backend/src/validators/recruiter.validator.js](file:///Users/karanrawat/Desktop/a_g/backend/src/validators/recruiter.validator.js)
* **Purpose**: Zod validation schemas for job postings (including `joiningMonth`, activeDays, openings, requirements, selectionProcess), verification requests, and application round progress updates (`PENDING`, `IN_PROGRESS`, `SCHEDULED`, `CLEARED`, `QUALIFIED`, `REJECTED`).
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: Appending new fields to job forms, modifying minimum active days, expanding round status states.
* **Risk**: Low.

#### [backend/src/validators/student.validator.js](file:///Users/karanrawat/Desktop/a_g/backend/src/validators/student.validator.js)
* **Purpose**: Zod validation schemas enforcing constraints on profile elements (experience arrays, education items, social URLs).
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: Customizing fields, setting rules for projects or portfolio links.
* **Risk**: Low.

#### [backend/src/validators/gig.validator.js](file:///Users/karanrawat/Desktop/a_g/backend/src/validators/gig.validator.js)
* **Purpose**: Zod validation schemas enforcing constraints on gig actions (gig creations, updates, category/categories selection, applications messages, chat messages, submissions descriptions, reviews ratings).
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: Appending new fields to gig creation forms, modifying minimum text lengths.
* **Risk**: Low.

#### [backend/src/validators/upload.validator.js](file:///Users/karanrawat/Desktop/a_g/backend/src/validators/upload.validator.js)
* **Purpose**: Zod schemas verifying file upload parameters (filename string, type categorization).
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: Customizing error messages.
* **Risk**: Low.

#### [backend/src/services/resume-parser/index.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/resume-parser/index.js)
* **Purpose**: Completely AI-free, offline resume parsing engine coordinating document text extraction (PDF/DOCX), string normalization, section splitting, and rule-based entity parsing.
* **Used By**: `student.controller.js`.
* **Dependencies**: `pdf-parse`, `mammoth`.
* **Safe Modifications**: Enhancing keyword dictionaries, adding extra aliases, updating regex matches.
* **Risk**: Low.

#### [backend/scripts/generateQuestions.js](file:///Users/karanrawat/Desktop/a_g/backend/scripts/generateQuestions.js)
* **Purpose**: Generates 50 questions per skill for the top 10 skills (500 total) from Groq LLM and writes them to a local JSON file.
* **Used By**: Human operators (offline).
* **Dependencies**: Groq API key in environment variables, `fs`, `path`.
* **Safe Modifications**: Modifying skills/subtopics definitions, adjusting concurrency or system prompt template.
* **Risk**: Low.

#### [backend/scripts/seedQuestions.js](file:///Users/karanrawat/Desktop/a_g/backend/scripts/seedQuestions.js)
* **Purpose**: Ingests offline generated questions JSON and bulk inserts them into MongoDB via Prisma client. It runs in dry-run mode by default, writing only when `--commit` is supplied.
* **Used By**: Human operators.
* **Dependencies**: [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js), `fs`, `path`.
* **Safe Modifications**: Changing file pathways, validation logic.
* **Risk**: Medium (can overwrite existing `Question` database rows when run with `--commit`).

#### [backend/scripts/verifyBankFlow.js](file:///Users/karanrawat/Desktop/a_g/backend/scripts/verifyBankFlow.js)
* **Purpose**: Mock-only end-to-end integration tests verifying seeding, mock client querying, case-insensitivity matching, legacy A-D formatting, and live generation fallback logic.
* **Used By**: Human operators / QA testing.
* **Dependencies**: [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js), `assert`, `fs`, `path`.
* **Safe Modifications**: Modifying assertions, changing test fixtures.
* **Risk**: Low.

---

#### [backend/scripts/generateRoadmaps.js](file:///Users/karanrawat/Desktop/a_g/backend/scripts/generateRoadmaps.js)
* **Purpose**: Offline generator for `SkillRoadmap` data (Phase 2). Ranks the 143 canonical skills via `scripts/skillRanking.json`, then generates a 10-15 subtopic interview syllabus per skill through `services/questionBank/roadmap/roadmapService.js` (Claude on Bedrock → Groq fallback). Persists each roadmap immediately to `scripts/output/roadmaps.json` (**resumable**: skips skills already valid; flags `--smoke=N`/`--only=Skill`/`--force`; `GEN_CONCURRENCY` + 429 retry). Prints a verification summary.
* **Risk**: Makes live LLM API calls. **Safe re: DB** — never requires `config/db`, writes only the output file; DB persistence is `seedRoadmaps.js`.

#### [backend/scripts/seedRoadmaps.js](file:///Users/karanrawat/Desktop/a_g/backend/scripts/seedRoadmaps.js)
* **Purpose**: Seeds `scripts/output/roadmaps.json` into the `SkillRoadmap` collection. Dry-run default; `--commit` upserts by `skillName` (idempotent). Exports `run()`. **`--commit` against prod is human-only (BLOCKER 1).**

#### [backend/scripts/verifyRoadmapFlow.js](file:///Users/karanrawat/Desktop/a_g/backend/scripts/verifyRoadmapFlow.js)
* **Purpose**: Mock-only e2e check of the roadmap seed/store flow. Forces `DATABASE_URL=''` before any require and hard-aborts unless `isMock()===true`; asserts dry-run writes nothing, commit upserts, re-seed is idempotent (in-place update), stored set validates.

#### backend/src/services/questionBank/roadmap/ + scripts/skillRanking.json
* **Purpose**: Roadmap generation module. `validate.js` (pure `validateRoadmap`/`validateRoadmapSet`), `prompts.js` (system/user prompts encoding the 10-15 foundational→advanced requirements), `roadmapService.js` (**provider-agnostic orchestrator**, Bedrock→Groq, short-circuits Bedrock after a 403), `providers/{bedrockProvider,groqProvider}.js`. No file here imports Prisma. `scripts/skillRanking.json` is the curated 1..143 popularity order.

### Frontend Files (`frontend/`)

### Frontend Modular Domain Architecture (`frontend/src/app/`, `features/`, `styles/`)

The frontend adheres to a feature-based domain architecture:
1. **App Coordinator (`frontend/src/app/App.jsx`)**: Coordinates route views, authentication state, role switches, and global modal overlays. `frontend/src/App.jsx` re-exports it for backwards compatibility.
2. **Styles (`frontend/src/styles/`)**: `index.css` (Tailwind v4 tokens, neumorphic styles) and `App.css`. `frontend/src/index.css` forwards to `styles/index.css`.
3. **Features (`frontend/src/features/`)**:
   - `auth/`: `pages/AuthView.jsx`, `pages/CandidateAuth.jsx`, `pages/RecruiterAuth.jsx`, and barrel `index.js`.
   - `student/`: `pages/StudentLayout.jsx`, `components/` (`StudentDashboard.jsx`, `StudentProfile.jsx`, etc.), and barrel `index.js`.
   - `recruiter/`: `pages/RecruiterLayout.jsx`, `components/` (`RecruiterJobs.jsx`, `RecruiterCandidates.jsx`, etc.), and barrel `index.js`.
   - `gigs/`: `pages/GigsMarketplace.jsx`, `components/` (`GigFilterSidebar.jsx`, `GigCard.jsx`, `GigDetailPage.jsx`), `gigConstants.js`, and barrel `index.js`.
   - `skill-test/`: `pages/TestView.jsx`, and barrel `index.js`.
   - `community/`: `pages/CommunityLayout.jsx`, `components/` (`CommunityFeed.jsx`, `PostComposer.jsx`, etc.), and barrel `index.js`.
4. **UI Primitives (`frontend/src/components/ui/`)**: Reusable atomic elements (`Button.jsx`, `Card.jsx`, `Input.jsx`, `Badge.jsx`, etc.).

#### [frontend/src/main.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/main.jsx)
* **Purpose**: The browser entrypoint which imports stylesheets, sets up root DOM components, and loads the main `App` React layer.
* **Used By**: [frontend/index.html](file:///Users/karanrawat/Desktop/a_g/frontend/index.html).
* **Dependencies**: `react`, `react-dom`, [frontend/src/App.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/App.jsx), [frontend/src/index.css](file:///Users/karanrawat/Desktop/a_g/frontend/src/index.css).
* **Safe Modifications**: Registering custom tracking utilities, global telemetry overlays.
* **Risk**: High (crashes render the entire page blank).

#### [frontend/src/App.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/App.jsx)
* **Purpose**: Top-level coordinator managing route mappings, routing states, user authorization storage hooks, and switching layouts based on user roles or lockout status.
* **Used By**: [frontend/src/main.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/main.jsx).
* **Dependencies**: `react`, `react-router-dom`, features and layout modules.
* **Safe Modifications**: Adjusting root path urls, adding public routing layers.
* **Risk**: High (routing errors impact application navigation).

#### [frontend/src/constants/index.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/constants/index.js)
* **Purpose**: Holds application-wide static constants (`ALL_SKILLS`, `API_BASE`).
* **Used By**: Feature components.
* **Dependencies**: None.

#### [frontend/src/features/Auth/AuthView.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Auth/AuthView.jsx)
* **Purpose**: JobsPlanet-style marketing landing page in the scoped "Dream Job Blue" theme (`.theme-jobsplanet` token overrides in `index.css` — royal blue #2563eb, navy headings, blue-tinted white bg, light+dark variants). Split hero (`/man_with_offer_letter.png` on a radial blob, floating "250+ Jobs" card, "Leo got hired" pill with `/happy_candidate.png`), Browse Jobs CTA, "How it Works" 4-step cards, feature tabs, roadmap, plus the login/register popup picker and slide-over auth drawer. Keeps the interactive DotGrid + ClickSpark background.

#### [frontend/src/features/SkillTest/TestView.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/SkillTest/TestView.jsx)
* **Purpose**: Renders the lockout-remedial test verification screen and contains static question datasets.

#### [frontend/src/features/Student/StudentLayout.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/StudentLayout.jsx) (and `pages/StudentLayout.jsx`)
* **Purpose**: Student navigation chrome/sidebar and coordinates Student portal views. Includes collapsible toggle sidebar (ChevronLeft/ChevronRight with adaptive branding), context-aware profile save banner with 2-second auto-dismiss, hover-revealed Gigs Marketplace sidebar submenu (Browse Gigs, My Gigs Workspace) that seamlessly switches marketplace views, and off-screen `StudentResume` DOM mount for PDF export.
* **Sub-components**:
  - `components/StudentDashboard.jsx`: Restructured Opportunities portal featuring top horizontal filter bar (`JobFilterBar.jsx`) and a sharp-cornered jobs container below housing sub-tabs ("All Job Openings" / "Your Applications") and a 3-in-a-row box card grid (`JobSnapshotCard.jsx`) with darker visible styling.
  - `components/JobFilterBar.jsx`: Top horizontal filter and search container with custom styled dropdowns (no OS native select popups) for Sort Order, Opportunity / Role, Place for Work (with integrated search option), Application Status, and Required Skills (searchable dropdown from ALL_SKILLS + quick popular chips), Stipend presets & custom Min/Max range, and Reset with sharp corners.
  - `components/JobSnapshotCard.jsx`: Box card format (3 in a row) displaying post name, company name with verified badge, square company logo box with uppercase initials monogram on top-right, stipend and location in middle, required skills tags, and application/test status with dark visible colors.
  - `pages/JobBriefPage.jsx`: Full-page job brief view rendered on `/job_brief?id=<jobId>`, showing complete recruiter-provided information (Hero header, company profile trigger, official website, place for work and maps URL, full stipend/compensation, key attributes overview grid, opportunity summary, role & responsibilities, required skill thresholds with upgrade test CTAs, selection process rounds, apply action, and jsPDF Download Brief PDF). Features a dedicated Share button on the right top corner of the job card immediately to the left of the "Apply Now" button, allowing candidates and users to copy the public job brief link with visual "Link Copied!" feedback. In public mode (`isPublic=true`), clicking Apply, Download Brief, Back, or Take Test redirects the user to the landing page `/?auth_prompt=signup_required`, triggering the emerald slide-in notification.
  - `pages/PublicJobBriefPage.jsx`: Standalone public view mounted in `App.jsx` when visiting `/job_brief?id=<jobId>`. Requires no login, contains no sidebar menu, displays the AlignGrade logo header with theme toggle and Sign In CTA, and renders `JobBriefPage` in `isPublic` mode where all actions route to `/?auth_prompt=signup_required`.
  - `components/StudentProfile.jsx`: Profile editing with 8-step horizontal top stepper (General, Introduction, Education, Experience, Certifications, Projects, Skills, Co-Curricular), profile header (avatar upload, debounced username availability checking, dynamic completeness meter with missing items dropdown, and PDF resume export button), horizontal box cards with bold dark typography for academic/work collections, and work preferences (modes, types, Indian states selector). The Skills step locks self-ratings for skills with MCQ tests to 1/10 (or their test score) with verified/unverified status indicators and no dropdown, while permitting interactive 1–10 self-rating only for untestable technical skills and soft skills.
  - `components/StudentResume.jsx`: Resume viewer and dynamically compiled PDF resume generator.
  - `components/StudentSkillTests.jsx`: Your Tests dashboard and continuous-scrolling MCQ assessment view (features high-visibility cards matching the Opportunities section with high-contrast borders and sharp typography, horizontal underline filter tabs for "All Skills", "Verified Skills", and "Unverified Skills" with active bottom-underline highlight, and an in-screen test completion modal popup overlay with darkened backdrop showing earned score with 70% verified vs unverified threshold status: unverified test completion offers Retake Test [fetches a brand-new 10-question set from the bank] and Close options, while verified completion offers only the Close option).
  - `components/StudentShowcase.jsx`: Showcase Yourself page with video duration guidelines popup (40s minimum, 60s maximum) before webcam recording.
  - `components/ParsedResumeReviewModal.jsx`: Review screen allowing candidates to review and edit extracted resume fields before saving.
  - `components/OnboardingModal.jsx`: One-time onboarding modal offering resume import or manual configuration upon fresh sign-up.

#### [frontend/src/features/Recruiter/RecruiterLayout.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Recruiter/RecruiterLayout.jsx)
* **Purpose**: Recruiter navigation sidebar and coordinates Recruiter hub views. Styled with the signature sharp-corner theme (`rounded-none`), crisp slate borders (`border-slate-300 dark:border-slate-700`), high-contrast dark text, sharp square profile avatar, and dark blue active item indicators (`bg-blue-700 text-white`). Includes expandable Gigs Marketplace sidebar submenu (Browse Gigs, Post a Gig, My Gigs Workspace) with synchronized view states and collapsible sidebar support.
* **Sub-components**:
  - `components/RecruiterDashboard.jsx`: Executive recruitment overview hub. Features KPI metrics, Recent Applications table, and the dynamically driven "Top Matching Talents" carousel section powered by `GET /api/recruiter/top-talents`. Displays candidate match percentages (`{matchScore}% Match`), test-verified badges, and matching skill level pills styled with the sharp-corner Industrial Skeuomorphic design system.
  - `components/RecruiterJobs.jsx`: Enterprise Job Dashboard managing active and paused opportunities, applicant reviews, and progress tracking. Styled with sharp-corner theme (`rounded-none`), high-contrast dark mode typography, and sharp KPI cards (distinguishing active vs paused roles). Features two dedicated sections below Posted Roles: "All Jobs" and "Paused Jobs" with an inline segmented view switcher (`Both Sections`, `All Jobs`, `Paused Jobs`). Provides 1-click **Pause/Resume** button on each job card to temporarily halt candidate showcase without losing any applicants or requirements; Live vs Paused badges; relocated **Detail Updated** badge (formerly "Updated") positioned immediately to the left of the applicant & days left metadata box with an active smooth blinking effect (`animate-blink`); simplified icon-only action button row with enlarged icons (`w-5 h-5`) for **Pause/Resume** (`PlayCircle`/`PauseCircle`), **Edit Role Details** (`Pencil`), **Remove Manually** (`Trash2`), and **Share Job** (`Share2`) to copy the public job brief link; quick Share button in the metadata header; and custom industrial-styled in-app confirmation modals replacing native browser alerts/confirm dialogs for deletion and pause/resume.
  - `components/CandidateProfileModal.jsx`: Recruiter modal for inspecting full candidate dossiers. Fixed vertical scroll freeze and infinite re-render loop (`Maximum update depth exceeded`) by adding `flex-1 min-h-0` to the modal body scroll container, anchoring `onClose` callback in a ref, guarding `recordViewedCandidate` to fire once per candidate ID, and debouncing duplicate view event dispatches in `recentCandidateViews.js`.
  - `components/RecruiterCustomDropdown.jsx`: Custom themed single-select dropdown component replacing native OS `<select>` elements with website design system tokens (`border-slate-300 dark:border-slate-700`, `rounded-none`, `bg-white dark:bg-slate-900`, `shadow-xl`, active blue accents, checkmarks, chevron rotation, custom scrollbar). Supports optional embedded search input with clear button (used for Indian States / UT locations) and group category dividers.
  - `components/SkillFilterDropdown.jsx`: Custom themed multi-select skill filter component with live search bar, comprehensive list combining `ALL_SKILLS` and existing candidate pool skill counts, and multi-skill checkboxes.
  - `components/RecruiterCandidates.jsx`: Exploring database profiles and stack filters. Restructured into a LinkedIn-style Split-Pane Master-Detail layout housed within a single unified chassis container (`h-[calc(100vh-175px)] min-h-[750px]` stretched to bottom): left column contains the candidate directory list with live search/filters and quick resume access, separated by a vertical border divider; right column presents the active candidate's comprehensive dossier (video showcase, bio, work preferences, verified skill levels, experience, projects, certifications, education, and social links). Features a comprehensive 4-row search and multi-filtering suite where all 9 filter controls use custom themed dropdowns (`SkillFilterDropdown` and `RecruiterCustomDropdown`), eliminating native OS `<select>` overlays: Row 1 integrates multi-criteria search (name, @username, title/designation, bio, skill names), primary themed dropdowns (multi-select Skill filter with embedded search, Work Mode, Work Type, Location in India with live search), and collapsible "More Filters" toggle button with active count badge; Row 2 provides collapsible Advanced Filters (Credentials: Verified Skills / Video Showcase / Resume Attached, Experience Level: Experienced vs Freshers, Match Score: ≥70% / ≥50% / Any, and Sort By: Recommended / Most Verified / Highest Skill Count / Name A-Z / Newest); Row 3 displays 1-click Popular Tech Stack quick chips (e.g. Python, React, Node.js, SQL, etc.) for instant stack filtering; Row 4 features an active filter tags status bar with `ActiveSkillChip` components rendering an inline themed Level selector on the right side of the skill name (allowing recruiters to set `Level 1+` to `Level 10` or `Verified Only` on MCQ technical skills), other filter removal chips, "Reset All" action, and live matching candidates count out of total pool. Defaults to displaying the first candidate on load and selection updates. Includes automated broken-avatar fallback to uppercase initials and standardized on-the-fly PDF resume generation via `ResumePdfTemplate` and `openResumePdfInNewTab`. Styled with the signature sharp-corner theme (`rounded-none`) and high-contrast dark shade typography.
  - `components/RecruiterPostJob.jsx`: Form builder for creating opportunities (Full-Time / Part-Time Job and Internship; Gig option removed in favor of dedicated Gigs Marketplace). Redesigned with sharp-corner theme (`rounded-none`), high-contrast dark shade typography (`text-slate-900 dark:text-slate-100`), crisp slate borders (`border-slate-300 dark:border-slate-700`), all 5 form sections (`Select Opportunity Type`, `Role & Company Details` with an informational notice stating that details in this section cannot be modified after posting, `Candidate Prerequisites & Skill Matrix`, `Compensation & Schedule`, `Description & Recruitment Process`) unified inside a single chassis container separated by line dividers (`divide-y divide-slate-300 dark:divide-slate-700`), streamlined 2-choice Opportunity Type selector, dynamic compensation and schedule configurations including Candidate Salary Visibility toggle button (controlling whether salary/stipend is shown or undisclosed to candidates across both Full-Time/Part-Time and Internship postings), Joining Month schedule option with presets (Immediate, within 15/30 days, or specific month presets), sharp range slider bars with square thumbs and gradient progress fill, multi-stage selection workflow builder, and sharp sticky 'Your Recent Postings' sidebar.
  - `components/EditJobModal.jsx`: Modal dialog for modifying posted job specifications (stipend, prerequisites, joiningMonth, duration, description, interview rounds, candidate salary visibility toggle) styled with sharp corners (`rounded-none`), dark backdrop overlay, and high-contrast inputs. The "Role & Company Details" section (Job Title/Designation, Company Name, Website, Location, URL, Openings) is locked as read-only with a Lock badge to maintain candidate clarity and applicant integrity.
  - `components/RecruiterCompany.jsx`: Company profile settings and trust verification hub. Restructured with the sharp-corner industrial theme (`rounded-none`), crisp slate borders (`border-slate-300 dark:border-slate-700`), and high-contrast dark typography (`text-slate-900 dark:text-slate-100`). All profile configuration steps (**Brand & Basic Identity**, **Recruiter Details**, **Social Profile Links**, and **Office Showcase Gallery**) are unified into a single chassis container separated by line dividers (`divide-y divide-slate-300 dark:divide-slate-700`), paired with a sticky right-hand **Trust & Verification** panel featuring status badges and PDF incorporation document upload.

#### [frontend/tailwind.config.js](file:///Users/karanrawat/Desktop/a_g/frontend/tailwind.config.js)
* **Purpose**: Declares color tokens and typography parameters matching the design system.
* **Used By**: PostCSS / Tailwind compiling.
* **Dependencies**: None.
* **Safe Modifications**: Adjusting color hex values, changing fallback font stacks.
* **Risk**: Medium.

#### [frontend/src/index.css](file:///Users/karanrawat/Desktop/a_g/frontend/src/index.css)
* **Purpose**: Loads Tailwind directives and registers the Industrial Skeuomorphism custom design system rules (light + dark mode, variables, shadow maps, LED badges, embossed text utilities). Also defines the scoped `.theme-jobsplanet` / `.dark .theme-jobsplanet` token override blocks (blue/white "Dream Job Blue" landing theme) used only by `AuthView.jsx`.
* **Used By**: [frontend/src/main.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/main.jsx).
* **Dependencies**: Tailwind directives.
* **Safe Modifications**: Adjusting theme color variables, custom scrollbar styling, neumorphic border rules.
* **Risk**: Medium.

#### [frontend/src/config/index.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/config/index.js)
* **Purpose**: Holds endpoint variables (e.g. `API_BASE`) which dynamically adjust depending on environment flags.
* **Used By**: [frontend/src/services/apiClient.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/services/apiClient.js).
* **Dependencies**: None.
* **Safe Modifications**: Changing backend server development address.
* **Risk**: Medium.

#### [frontend/src/constants/domains.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/constants/domains.js)
* **Purpose**: Provides lists of focus domains (e.g. Web Dev, AI/ML, Cloud Dev) for search forms.
* **Used By**: Recruiter and Student components.
* **Dependencies**: None.
* **Safe Modifications**: Appending new domain groups.
* **Risk**: Low.

#### [frontend/src/constants/skills.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/constants/skills.js)
* **Purpose**: Array of all candidate/job skills recognized by the frontend client.
* **Used By**: Feature components.
* **Dependencies**: None.
* **Safe Modifications**: Adding skill names to the array.
* **Risk**: Low.

#### [frontend/src/constants/testQuestions.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/constants/testQuestions.js)
* **Purpose**: Defines offline quiz datasets fallback questions when LLM endpoints are unreachable.
* **Used By**: Student and SkillTest components.
* **Dependencies**: None.
* **Safe Modifications**: Appending new question objects.
* **Risk**: Low.

#### [frontend/src/constants/index.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/constants/index.js)
* **Purpose**: Backward-compatible barrel module re-exporting API endpoints and skill lookups.
* **Used By**: Feature components.
* **Dependencies**: [frontend/src/config/index.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/config/index.js), [frontend/src/constants/skills.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/constants/skills.js).
* **Safe Modifications**: Re-exporting new constants files.
* **Risk**: Low.

#### [frontend/src/services/apiClient.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/services/apiClient.js)
* **Purpose**: Custom wrapper around the native `fetch` API. Handles request routing, injects authorization bearer tokens from localStorage, parses JSON, and standardizes error formats.
* **Used By**: All frontend components making network requests.
* **Dependencies**: [frontend/src/config/index.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/config/index.js).
* **Safe Modifications**: Injecting custom logger callbacks, formatting exception messages.
* **Risk**: High (failures block frontend-backend API requests).

#### [frontend/src/services/resumePdf.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/services/resumePdf.js)
* **Purpose**: Converts candidate and student profile HTML layout elements into clean downloadable and in-browser viewable PDF format (`generateResumePdf`, `generateResumePdfBlob`, `openResumePdfInNewTab`).
* **Used By**: [frontend/src/features/Student/components/StudentResume.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/components/StudentResume.jsx), [frontend/src/features/Recruiter/components/CandidateProfileModal.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Recruiter/components/CandidateProfileModal.jsx).
* **Dependencies**: `html2canvas`, `jspdf`.
* **Safe Modifications**: Adjusting margins, changing scale layout settings.
* **Risk**: Low.

#### [frontend/src/services/uploadService.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/services/uploadService.js)
* **Purpose**: Uploads file buffers directly to AWS S3 using presigned URLs.
* **Used By**: [frontend/src/features/Student/components/StudentProfile.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/components/StudentProfile.jsx), [frontend/src/features/Recruiter/components/RecruiterCompany.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Recruiter/components/RecruiterCompany.jsx).
* **Dependencies**: None (uses raw `fetch`).
* **Safe Modifications**: Editing request timeout frames.
* **Risk**: Medium.

#### [frontend/src/utils/errorFormatter.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/utils/errorFormatter.jsx)
* **Purpose**: Helper module that dynamically parses raw JSON-stringified Zod error lists from backend validation failures and formats them into themed, presentable list items.
* **Used By**: [StudentProfile.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/components/StudentProfile.jsx), [StudentResume.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/components/StudentResume.jsx), [CandidateAuth.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Auth/CandidateAuth.jsx), [RecruiterAuth.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Auth/RecruiterAuth.jsx), [RecruiterLayout.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Recruiter/RecruiterLayout.jsx), and [StudentLayout.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/StudentLayout.jsx).
* **Dependencies**: `react`, `lucide-react`.
* **Safe Modifications**: Tweaking style tags, error layouts, or text descriptions.
* **Risk**: Low.

#### [frontend/src/utils/profileCompleteness.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/utils/profileCompleteness.js)
* **Purpose**: Pure function helpers (`getProfileCompletionDetails`, `calculateOverallProfileCompleteness`, `hasGeneralInfo`, `hasSkills`, `hasIntroVideo`, `isProfileComplete`) evaluating student profile fields across 9 weighted sections (Basic Info 35%, Skills 15%, Education 10%, Experience 10%, Projects 10%, Certifications 5%, Profile Photo 5%, Work Preferences 5%, Introduction Video 5%) to output a 0-100% score and dynamic missing items checklist. `isProfileComplete` validates mandatory general profile setup (`hasGeneralInfo`) to unlock portal navigation (Opportunities, Job Progress, Gigs Marketplace), while the Skill Tests section (`Your Tests`) is always accessible without restrictions.
* **Used By**: [StudentLayout.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/pages/StudentLayout.jsx), [StudentProfile.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/components/StudentProfile.jsx), [StudentDashboard.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/components/StudentDashboard.jsx).
* **Dependencies**: None.
* **Safe Modifications**: Adjusting section weights or adding newly supported profile collections.
* **Risk**: Low.

#### [frontend/src/utils/recentCandidateViews.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/utils/recentCandidateViews.js)
* **Purpose**: Manages recently viewed candidate profiles in browser `localStorage` per recruiter (`aligngrade_recently_viewed_${recruiterId}`). Provides `getRecentlyViewedCandidates(recruiterId, limit)` returning up to the last N (default 5) profiles, `recordViewedCandidate(candidate, recruiterId)` which deduplicates, records timestamps, and keeps up to 20 profiles, `formatViewedTime(isoString)` for human-readable relative time formatting ('Just now', '5m ago', '2h ago', '1d ago'), and emits `recently_viewed_candidates_changed` custom events for instantaneous reactive cross-component state synchronization.
* **Used By**: [RecruiterDashboard.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Recruiter/components/RecruiterDashboard.jsx), [CandidateProfileModal.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Recruiter/components/CandidateProfileModal.jsx), [RecruiterCandidates.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Recruiter/components/RecruiterCandidates.jsx).
* **Dependencies**: None (`localStorage`, browser `CustomEvent`).
* **Safe Modifications**: Adjusting history retention limit or date formatting labels.
* **Risk**: Low.

#### [frontend/src/components/ConnectionLoader.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/components/ConnectionLoader.jsx)
* **Purpose**: A floating banner component that pings the backend `/health` check in the background. Renders a warning notification if the backend becomes unreachable.
* **Used By**: [frontend/src/App.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/App.jsx).
* **Dependencies**: `react`, `lucide-react`.
* **Safe Modifications**: Customizing styling parameters, adjusting check intervals.
* **Risk**: Low.

#### [frontend/src/components/EmeraldSignupToast.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/components/EmeraldSignupToast.jsx)
* **Purpose**: Slide-in notification component styled with AlignGrade's signature emerald theme (`#003527` background, `border-emerald-400`, luminous emerald badge, and crisp typography). Alerting unauthenticated candidates redirected from shared job links that they need to sign up first. Includes auto-dismiss timer (8s), manual close, and a "Sign Up Now" CTA button that immediately switches to candidate registration.
* **Used By**: [frontend/src/app/App.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/app/App.jsx).
* **Dependencies**: `lucide-react`, `index.css` (`animate-toast-slide-in`, `animate-toast-fade-out`).
* **Safe Modifications**: Adjusting display duration or copy.
* **Risk**: Low.

#### [frontend/src/components/JobDetailsModal.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/components/JobDetailsModal.jsx)
* **Purpose**: Overlaid modal details panel showing job descriptions, requirement checks, and eligibility flags. Runs eligibility checks and processes job application submissions.
* **Used By**: Student dashboard views.
* **Dependencies**: UI components, icons.
* **Safe Modifications**: Rearranging spec list blocks, style improvements.
* **Risk**: Medium.

#### UI Primitives (`frontend/src/components/ui/`)
* **`AnimatedContent.jsx`**: Layout container using Framer Motion to animate UI entry.
* **`Badge.jsx`**: Skeuomorphic badge tags displaying skills or state labels.
* **`Button.jsx`**: Styled chassis button supporting raised, pressed, loading, and LED statuses.
* **`Card.jsx`**: Standard container chassis for UI cards.
* **`ClickSpark.jsx`**: Particle spark canvas overlay following user click indicators.
* **`DotGrid.jsx` & `DotGrid.css`**: Background dot matrix canvas overlay.
* **`EmptyState.jsx`**: Recessed warning card rendering empty lists.
* **`Input.jsx`**: Neumorphic text inputs with recessed inset shadows.
* **`PageHeader.jsx`**: Page headers containing titles and sub-info descriptions.
* **`Select.jsx`**: Neumorphic selection dropdown container.
* **`SidebarNavItem.jsx`**: Navigation items for sidebar layouts.
* **`StatCard.jsx`**: Displays dashboard metrics with icon badges.
* **`TextArea.jsx`**: Neumorphic recessed multiline inputs.
* **`ThemeToggle.jsx`**: Slide button changing themes between light and dark modes.

#### Feature Views (`frontend/src/features/`)
* **`Auth/AuthView.jsx`**: JobsPlanet-style blue marketing landing page (scoped `.theme-jobsplanet` tokens, hero with public-folder imagery on radial blob, How-it-Works steps) with popup auth picker and feature demo widgets.
* **`Auth/CandidateAuth.jsx`**: Dedicated Candidate login and signup pages matching the skeuomorphic theme.
* **`Auth/RecruiterAuth.jsx`**: Dedicated Recruiter login and signup pages matching the skeuomorphic theme.
* **`SkillTest/TestView.jsx`**: Lockdown fullscreen exam panel checking focus state changes and scoring MCQ answers.
* **`Recruiter/RecruiterLayout.jsx`**: Sidebar navigation shell managing Recruiter views and passing live data.
* **`Recruiter/components/RecruiterDashboard.jsx`**: Executive dashboard hub featuring the "Top Matching Talents" horizontal carousel (limited to top 15 matching profiles, driven by the dynamic Recruiter Demand Profile engine computed across active jobs, with a "View All" button adjacent to the left navigation arrow redirecting to the Candidate Directory) and the "Recently Viewed Candidates" table section showing the last 5 candidate profiles viewed by the current recruiter (avatar, name/handle, verification check, title & location, key skill level badges, relative view timestamp via `formatViewedTime`, and instant View Profile action). Replaced the legacy "Recent Applications" table.
* **`Recruiter/components/CandidateProfileModal.jsx`**: Reusable candidate profile dossier drawer modal with PDF/Drive resume viewer. Automatically records the viewed candidate via `recordViewedCandidate(candidate)` whenever opened.
* **`Recruiter/components/EditJobModal.jsx`**: Recruiter modal to update job parameters, duration, stipend, candidate salary visibility toggle, and required thresholds, with the "Role & Company Details" section permanently locked as read-only.
* **`Recruiter/components/RecruiterJobs.jsx`**: Active and paused jobs directory with applicant review drawers, dual-section layout ("All Jobs" and "Paused Jobs") with segmented view toggling, Pause/Resume functionality to halt showcasing without losing data, Live/Paused badges, action icons for Edit Role Details (`Pencil`) and Remove Manually (`Trash2`), relocated "Detail Updated" badge placed to the left of metadata box with active blinking animation, and custom in-app confirmation modals replacing native alerts.
* **`Recruiter/components/RecruiterCandidates.jsx`**: Candidate lookup directory with LinkedIn-style Split-Pane Master-Detail layout, default selection of first candidate, permanent PDF/Drive resume viewer integration, automated candidate view recording on card selection, default ordering matching the Top Matching Talents suggestion/recommendation ranking when no search/filters are applied, and a comprehensive 4-row search & multi-filtering toolbar with fully themed custom dropdowns (`RecruiterCustomDropdown` and `SkillFilterDropdown`, eliminating all native OS selects). Features multi-criteria search, multi-skill selection with live search bar, per-skill rating threshold controls gated strictly to technical skills with MCQs (`hasSkillMcq`), work mode, work type, location in India, collapsible advanced filters for credentials/experience/match score/sort order, 1-click popular tech stack quick chips, active filter tags with individual removal & reset all, and highlighted matching skill pills on candidate cards.
* **`Recruiter/components/RecruiterCustomDropdown.jsx`**: Custom themed single-select dropdown component replacing native OS select controls with design system tokens, supporting search and grouping.
* **`Recruiter/components/SkillFilterDropdown.jsx`**: Custom themed multi-select skill filter component with live search, category tabs, candidate counts, pinned active filters, and per-skill rating controls gated to MCQ-tested technical skills.
* **`Recruiter/components/RecruiterPostJob.jsx`**: Forms to create new job and internship opportunities (Gig option removed in favor of dedicated Gigs Marketplace) with candidate salary visibility toggle (Show/Hide Salary for candidates across Full-Time/Part-Time and Internship), required thresholds, selection rounds, and Joining Month schedule option, styled with sharp corners (`rounded-none`) and high-contrast typography.
* **`Recruiter/components/RecruiterCompany.jsx`**: Company profile settings and business verification hub. Restructured with sharp-corner theme (`rounded-none`), high-contrast typography, a single unified container for Brand Identity, Recruiter Details, Social Links, and Office Showcase Gallery, alongside a sticky Trust & Verification status panel.
* **`Student/StudentLayout.jsx`**: Sidebar navigation shell managing Student views, `/job_brief` route synchronization, and `onAddSkillAndUpgrade` handler for auto-adding missing skills to candidate profiles before test redirect.
* **`Student/components/StudentDashboard.jsx`**: Opportunities hub with top horizontal `JobFilterBar` and lower sharp-cornered container with sub-tabs ("All Job Openings" / "Your Applications") and 3-in-a-row box grid of `JobSnapshotCard` items. Safely ignores hidden salaries in numeric sorting/filtering.
* **`Student/components/JobFilterBar.jsx`**: Full-width top filter container with sharp corners, search, sort order, role filters, Indian states place for work, required skill tags, stipend ranges, and status toggles.
* **`Student/components/JobSnapshotCard.jsx`**: 3-in-a-row box card format displaying company logo box (with uppercase initials fallback) on top-right, post name and company name on top-left, stipend and place for work in middle (automatically masking to 'Salary Undisclosed' / 'Stipend Undisclosed' when recruiter toggles `showSalary: false`), required skills badges, and application eligibility/test status.
* **`Student/pages/JobBriefPage.jsx`**: Dedicated job brief page (`/job_brief?id=<jobId>`) showing all recruiter-provided details (summary, responsibilities, rating thresholds with test upgrade CTAs, selection rounds, apply action, compensation card masking to 'Salary Undisclosed' / 'Stipend Undisclosed' when `showSalary: false`, and PDF download). Includes interactive verification gating modal with smooth auto-scroll to top: if the skill is already on the candidate profile, it confirms redirection to the skill test; if not in the profile, it confirms adding the skill at baseline Level 1 to the profile and immediately redirecting to the verification test to unlock the role.
* **`Student/components/StudentProfile.jsx`**: Candidate profiles editor panel (experience list, projects, skills).
* **`Student/components/StudentProgress.jsx`**: Tracker panel displaying candidate application rounds structured within a single unified high-visibility container with sharp edges (`border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x`). The left column (`lg:col-span-4`) displays the list of applied jobs with logo boxes, company names, titles, and overall status badges (`divide-y divide-slate-200 dark:divide-slate-800`), while the right column (`lg:col-span-8`) renders detailed selection progress and round timelines excluding the default 'Applied for Job' step, showing actual evaluation stages, dates, recruiter feedback cards, and masked stipend ('Undisclosed' when `showSalary: false`).
* **`Student/components/StudentResume.jsx`**: Resume builder generating downloadable PDF resume layouts.
* **`Gigs/GigsMarketplace.jsx`**: Shared dashboard component handling the gigs marketplace browse list, posting form with optional gig logo upload and multi-currency selection (INR, USD, EUR, GBP, CAD, AUD, AED, SGD), select and hire freelancers controls, messaging chat panel, work submissions triggers, and review forms (enabled in Candidate and Recruiter portals). Receives `activeSubTab` and `onSubTabChange` from parent layouts (RecruiterLayout / StudentLayout) driven directly by the sidebar submenu (top horizontal sub-tabs removed for a cleaner workspace experience). Styled with unified sharp rectangular aesthetics (`rounded-none`), high-contrast slate borders (`border-slate-300 dark:border-slate-700`), bold Inter typography, and saturated badges across Browse Gigs, Post a Gig, My Gigs Workspace, and all popups/modals. Chat messages use modern rounded bubble styling (`rounded-2xl`) for both candidate and recruiter portals. The metrics bar in the center panel dynamically scopes cards: recruiters see all 4 metrics (Budget, Delivery, Assigned, Review Queue), while candidates see only relevant candidate metrics (Budget and Delivery). The Browse Gigs list container features a thin, visible 1px horizontal separation line between cards (`divide-y divide-slate-300 dark:divide-slate-700 rounded-none shadow-2xs`). The Recruiter Edit Gig modal is structured as a wide horizontal 2-column dialog (`max-w-4xl max-h-[88vh] flex flex-col`) with sticky header, scrollable body containing left-column scope/budget/specs and right-column scroll-constrained skills sliders + logo uploader, and sticky footer guaranteeing visible action buttons on all displays. In the Edit Gig modal, Title and Category of Field are strictly non-editable (Title is read-only with Lock icon; Category of Field is rendered in locked badge chips without picker or delete buttons; and backend preserves original title and categories). The Browse Gigs section features a 2-column layout with a left filter sidebar (`GigFilterSidebar.jsx`), a right-hand zero-gap edge-to-edge stacked gigs list (`divide-y divide-slate-300 dark:divide-slate-700` with `GigCard.jsx`), and full-page gig overview inspection (`GigDetailPage.jsx`). The "My Gigs Workspace" view features a single unified chassis container (`bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none divide-x divide-slate-300 dark:divide-slate-700`) housing 3 seamless internal panels: Panel 1 (Left: Hosted Gigs scrollable list with zero outer margin/padding using edge-to-edge `divide-y divide-slate-300 dark:divide-slate-700` stacked gig rows), Panel 2 (Center: Gig Header with status, brief modal trigger, recruiter controls, key metrics row, active candidate action subheader with Submission and Profile Info triggers, and live chat feed with attachments composer), and Panel 3 (Right: Assigned Talent with review room alongside Awaiting Review pitches with zero outer margin/padding using edge-to-edge `divide-y divide-slate-300 dark:divide-slate-700` stacked candidate rows).
* **`Gigs/components/GigFilterSidebar.jsx`**: Left-side comprehensive filter panel providing sort order options, keyword/role search, category selector (60+ specializations), multi-skill tags with popular skill quick-add chips, budget range presets (< ₹5k, ₹5k-₹20k, ₹20k-₹50k, ₹50k+) & custom min/max inputs, delivery timeline options (Any, ≤ 3 Days, ≤ 1 Week, ≤ 2 Weeks, 2+ Weeks), required skill level thresholds, verified employer trust filter, live match count, reset filters button, styled with sharp high-contrast container borders (`border-slate-300 dark:border-slate-700 rounded-none shadow-2xs`), bold labels, and saturated blue active buttons.
* **`Gigs/components/GigCard.jsx`**: Horizontal gig card featuring recruiter/company logo box on the left with proportional compact sizing (`w-12 h-12 sm:w-14 sm:h-14 rounded-none border border-slate-300 dark:border-slate-700` with initials fallback) and gig information on the right (role in bold headline typography, client trust verification badge, saturated emerald compensation badge via `getCurrencySymbol`, category pills, delivery timeline, tech skills badges, and click-to-view navigation) with thin 1px dividing lines.
* **`Gigs/components/GigDetailPage.jsx`**: Dedicated full-page gig detail view with sticky top navigation bar (`sticky top-0 z-20` featuring `Back to Browse Gigs` and top quick `Pitch & Apply` CTA), compact logo frame on the left of header, gig title positioned prominently on top with status and category tags positioned neatly below it, a wider low-profile horizontal hero card integrating Compensation, Delivery, and direct full-width candidate `Pitch & Apply for Gig` button (with automatic smooth scrolling to the pitch application modal), tightened vertical rhythm across Task Description, Required Technical Stack, and Brief Attachments, secondary bottom CTA for long descriptions, recruiter management controls with sharp slate borders (`rounded-none border-slate-300 dark:border-slate-700`), full-width horizontally stretched reference attachment cards (`w-full` stacked list with file name, file icon, and quick 'Open file' badge), and strict skill threshold gating matching the job brief system (candidates lacking required skills or meeting thresholds are locked from applying and provided an interactive `testPromptModal` with smooth auto-scroll to top to either add missing skills to their profile or proceed directly to certification tests to unlock their pitch application).
* **`Gigs/gigConstants.js`**: Centralized currency configuration `SUPPORTED_CURRENCIES` (INR ₹, USD $, EUR €, GBP £, CAD CA$, AUD AU$, AED AED, SGD SG$) and `getCurrencySymbol(code)` pure helper function.

---

### Admin Portal Files (`admin_ws/`)

### Admin Workspace Modular Architecture (`admin_ws/backend/src/modules/`, `admin_ws/frontend/src/app/`, `styles/`)

Following Rule 2 (Admin Portal Isolation), `admin_ws` remains completely standalone with zero imports from the main application. Its backend and frontend have been restructured into clean modules:

1. **Admin Backend Modules (`admin_ws/backend/src/modules/`)**:
   - `auth/`: Admin authentication (`auth.controller.js`, `auth.routes.js`, `index.js`).
   - `dashboard/`: Overview analytics and summary telemetry (`dashboard.controller.js`, `dashboard.routes.js`, `index.js`).
   - `students/`: Candidate account oversight and verification auditing (`student.controller.js`, `student.routes.js`, `index.js`).
   - `recruiters/`: Company trust scoring and recruiter auditing (`recruiter.controller.js`, `recruiter.routes.js`, `index.js`).
   - `jobs/`: Job postings validation and auditing (`job.controller.js`, `job.validator.js`, `job.routes.js`, `index.js`).
   - `analytics/`: Skill supply vs demand analytics (`analytics.controller.js`, `analytics.routes.js`, `index.js`).
   - `storage/`: S3 and MongoDB storage calculation and billing estimates (`storage.controller.js`, `storage.routes.js`, `services/`, `index.js`).
   - Mounted modularly in `admin_ws/backend/app.js` with legacy `admin_ws/backend/src/routes/*.routes.js` shims preserved.

2. **Admin Frontend Architecture (`admin_ws/frontend/src/`)**:
   - `app/App.jsx`: Main administrative dashboard layout coordinator.
   - `styles/index.css`: Tailwind styling tokens and appearances.
   - `api/adminApi.js`: Centralized administrative API fetch wrapper.
   - `main.jsx`: Mounts `app/App.jsx` and `styles/index.css`.

#### [admin_ws/package.json](file:///Users/karanrawat/Desktop/a_g/admin_ws/package.json)
* **Purpose**: Coordinates administrative tasks (booting dev configurations, workspace scripts, docker controls).
* **Used By**: Root package runner.
* **Dependencies**: None.

#### [admin_ws/docker-compose.yml](file:///Users/karanrawat/Desktop/a_g/admin_ws/docker-compose.yml)
* **Purpose**: Provisions container setups (like local database engines) for testing admin systems locally.
* **Used By**: Docker client CLI.
* **Dependencies**: None.

#### [admin_ws/backend/server.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/server.js)
* **Purpose**: Administrative backend server entrypoint. Binds server ports, imports app logic, and handles startup logs.
* **Used By**: Admin backend scripts.
* **Dependencies**: [admin_ws/backend/app.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/app.js).
* **Safe Modifications**: Customizing startup diagnostics, log outputs.
* **Risk**: High (crashes take down the admin API server).

#### [admin_ws/backend/app.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/app.js)
* **Purpose**: Mounts admin config middlewares (CORS, body-parsers), validation, error interceptors, and admin routes.
* **Used By**: [admin_ws/backend/server.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/server.js).
* **Dependencies**: `express`, cors, routes.
* **Safe Modifications**: Registering custom admin route namespaces.
* **Risk**: High.

#### [admin_ws/backend/src/config/database.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/database.js)
* **Purpose**: Initializes the native `mongodb` driver connection, bypassing Prisma to prevent dependency issues with the main application schema. Exposes `getDbSafe()` to safely retrieve connections.
* **Used By**: All administrative controllers.
* **Dependencies**: `mongodb`, [admin_ws/backend/src/config/env.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/env.js).
* **Safe Modifications**: Tweaking connection pool configurations, retry intervals.
* **Risk**: High (essential database access gateway for the admin backend).

#### [admin_ws/backend/src/config/env.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/env.js)
* **Purpose**: Validates administrative environment keys, failing fast if production secrets are missing on boot.
* **Used By**: Admin backend files referencing process envs.
* **Dependencies**: `dotenv`.
* **Safe Modifications**: Appending environment variables.
* **Risk**: High.

#### [admin_ws/backend/src/config/rateLimit.config.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/rateLimit.config.js)
* **Purpose**: Declares rate limits for administrative backend routes.
* **Used By**: [admin_ws/backend/src/middleware/rateLimiter.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/middleware/rateLimiter.js).
* **Dependencies**: None.
* **Safe Modifications**: Altering request limits.
* **Risk**: Low.

#### [admin_ws/backend/src/config/s3.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/s3.js)
* **Purpose**: Configures the AWS S3 client for storage analysis routes.
* **Used By**: [admin_ws/backend/src/services/s3Storage.service.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/services/s3Storage.service.js).
* **Dependencies**: `@aws-sdk/client-s3`.
* **Safe Modifications**: Changing region settings.
* **Risk**: Medium.

#### [admin_ws/backend/src/controllers/auth.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/auth.controller.js)
* **Purpose**: Manages administrative portal login, verifying credentials against hardcoded values and returning JWT tokens.
* **Used By**: [admin_ws/backend/src/routes/auth.routes.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/routes/auth.routes.js).
* **Dependencies**: `jsonwebtoken`, [admin_ws/backend/src/config/env.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/env.js).
* **Safe Modifications**: Tweaking session durations or updating hardcoded credentials.
* **Risk**: High (controls access keys).

#### [admin_ws/backend/src/controllers/analytics.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/analytics.controller.js)
* **Purpose**: Queries MongoDB collections to calculate skill trends (recruiter job demands vs student profile strengths) for horizontal bar charts.
* **Used By**: [admin_ws/backend/src/routes/analytics.routes.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/routes/analytics.routes.js).
* **Dependencies**: [admin_ws/backend/src/config/database.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/database.js).
* **Safe Modifications**: Changing aggregation logic, modifying labels output format.
* **Risk**: Medium.

#### [admin_ws/backend/src/controllers/dashboard.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/dashboard.controller.js)
* **Purpose**: Compiles statistics (active postings count, student profiles, recruiter verifications) and recent actions to populate the dashboard overview metrics.
* **Used By**: [admin_ws/backend/src/routes/dashboard.routes.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/routes/dashboard.routes.js).
* **Dependencies**: [admin_ws/backend/src/config/database.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/database.js).
* **Safe Modifications**: Adding metrics to summary cards.
* **Risk**: Medium.

#### [admin_ws/backend/src/controllers/job.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/job.controller.js)
* **Purpose**: Returns active opportunities lists, requirement details, and associated candidate applications.
* **Used By**: [admin_ws/backend/src/routes/job.routes.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/routes/job.routes.js).
* **Dependencies**: [admin_ws/backend/src/config/database.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/database.js).
* **Safe Modifications**: Tweaking query projection scopes.
* **Risk**: Medium.

#### [admin_ws/backend/src/controllers/recruiter.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/recruiter.controller.js)
* **Purpose**: Queries recruiter list details and coordinates updates to company trust validation check tags.
* **Used By**: [admin_ws/backend/src/routes/recruiter.routes.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/routes/recruiter.routes.js).
* **Dependencies**: [admin_ws/backend/src/config/database.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/database.js).
* **Safe Modifications**: Customizing company listing order formats.
* **Risk**: High (updates recruiter validation statuses).

#### [admin_ws/backend/src/controllers/student.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/student.controller.js)
* **Purpose**: Fetches candidate list parameters, including full profiles, skills ratings, and certificates test histories.
* **Used By**: [admin_ws/backend/src/routes/student.routes.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/routes/student.routes.js).
* **Dependencies**: [admin_ws/backend/src/config/database.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/database.js).
* **Safe Modifications**: Updating field projections.
* **Risk**: Medium.

#### [admin_ws/backend/src/controllers/storage.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/storage.controller.js)
* **Purpose**: Combines MongoDB statistics and S3 file metadata query responses to serve database size and usage metrics for the storage explorer views.
* **Used By**: [admin_ws/backend/src/routes/storage.routes.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/routes/storage.routes.js).
* **Dependencies**: [admin_ws/backend/src/services/s3Storage.service.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/services/s3Storage.service.js), [admin_ws/backend/src/services/mongoStorage.service.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/services/mongoStorage.service.js), [admin_ws/backend/src/mocks/storage.mock.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/mocks/storage.mock.js).
* **Safe Modifications**: Structuring response layouts.
* **Risk**: Medium.

#### [admin_ws/backend/src/middleware/auth.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/middleware/auth.js)
* **Purpose**: JWT verification guard protecting administrative routes. Validates signed headers and appends decoded user context to requests.
* **Used By**: [admin_ws/backend/app.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/app.js).
* **Dependencies**: `jsonwebtoken`, [admin_ws/backend/src/config/env.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/env.js).
* **Safe Modifications**: Adjusting error response formats.
* **Risk**: High (handles route authorization).

#### [admin_ws/backend/src/middleware/errorHandler.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/middleware/errorHandler.js)
* **Purpose**: Catches unhandled errors in administrative routes, outputs diagnostics logging, and masks raw database issues in production.
* **Used By**: [admin_ws/backend/app.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/app.js).
* **Dependencies**: None.
* **Safe Modifications**: Formatting admin error outputs.
* **Risk**: Low.

#### [admin_ws/backend/src/middleware/rateLimiter.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/middleware/rateLimiter.js)
* **Purpose**: Enforces administrative endpoint rate limits.
* **Used By**: Admin routing configurations.
* **Dependencies**: [admin_ws/backend/src/config/rateLimit.config.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/config/rateLimit.config.js).
* **Safe Modifications**: Changing lock messages.
* **Risk**: Medium.

#### [admin_ws/backend/src/middleware/validate.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/middleware/validate.js)
* **Purpose**: Middleware wrapping Zod schema checks for admin request validation.
* **Used By**: Admin routing configurations.
* **Dependencies**: `zod`.
* **Safe Modifications**: Customizing error lists layouts.
* **Risk**: Medium.

#### [admin_ws/backend/src/mocks/storage.mock.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/mocks/storage.mock.js)
* **Purpose**: Declares fallback storage sizes and S3 cost simulations if live cloud components are offline.
* **Used By**: [admin_ws/backend/src/controllers/storage.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/storage.controller.js).
* **Dependencies**: None.
* **Safe Modifications**: Updating fallback metrics.
* **Risk**: Low.

#### Admin Routing Maps (`admin_ws/backend/src/routes/`)
* **`analytics.routes.js`**: Binds routes checking candidate specializations and recruiter demand ratios.
* **`dashboard.routes.js`**: Binds routes compiling general system stats cards.
* **`job.routes.js`**: Binds routes listing active job vacancies and details.
* **`recruiter.routes.js`**: Binds routes handling company verify checks.
* **`student.routes.js`**: Binds routes returning candidate lists.
* **`storage.routes.js`**: Binds routes fetching storage bills and logs.
* **`auth.routes.js`**: Exposes the `/login` endpoint mapping to the administrative auth controller.

#### Administrative Storage Services (`admin_ws/backend/src/services/`)
* **`mongoStorage.service.js`**: Uses native database commands to measure collection sizes and estimates MongoDB Atlas monthly pricing.
* **`s3Storage.service.js`**: Lists files in S3 buckets, groups items by folders, and estimates AWS billing sums.

#### [admin_ws/backend/src/utils/formatBytes.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/utils/formatBytes.js)
* **Purpose**: Helper function formatting bytes counts to human-readable strings (e.g. KB, MB, GB).
* **Used By**: Storage services.
* **Dependencies**: None.
* **Safe Modifications**: Tweaking float formatting parameters.
* **Risk**: Low.

#### [admin_ws/backend/src/validators/job.validator.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/validators/job.validator.js)
* **Purpose**: Zod validation schema ensuring path job ID strings conform to strict MongoDB 24-character hexadecimal ObjectId rules.
* **Used By**: [admin_ws/backend/src/routes/job.routes.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/routes/job.routes.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: None.
* **Risk**: Low.

#### Admin Frontend Application (`admin_ws/frontend/`)
* **`admin_ws/frontend/index.html`**: Host document rendering administrative components.
* **`admin_ws/frontend/vite.config.js`**: Configures port 5174 for administrative dashboard deployment.
* **`admin_ws/frontend/tailwind.config.js` & `postcss.config.js`**: PostCSS assets.
* **`admin_ws/frontend/src/index.css`**: Styling entry point.
* **`admin_ws/frontend/src/main.jsx`**: Renders administrative dashboard pages into DOM frameworks.
* **`admin_ws/frontend/src/App.jsx`**: Coordinates administrative dashboards panels (Dashboard KPIs, Students lists, Recruiters audit queue, Jobs listings drawers) and detail modals.
* **`admin_ws/frontend/src/api/adminApi.js`**: Administrative endpoint fetch client.

---

## 4. Dependency Map

### Frontend Dependency Chain
```
index.html
  └── src/main.jsx
        ├── src/index.css (Loads Tailwind & custom scrollbars)
        └── src/App.jsx (Top-level router & state keeper)
              ├── src/config/index.js (API_BASE) + src/constants/* (ALL_SKILLS, domains, testQuestions)
              ├── src/services/ (apiClient.apiFetch, uploadService.putFileToS3, resumePdf) — used by all feature views for network/upload/PDF
              ├── src/utils/profileCompleteness.js (student gating rules)
              ├── src/features/Auth/AuthView.jsx (Signup/Login)
              ├── src/features/SkillTest/TestView.jsx (Remedial quiz)
              ├── src/features/Student/StudentLayout.jsx (Student Portal)
              │     └── components/ (Dashboard, Profile, Progress, Resume, SkillTests)
              └── src/features/Recruiter/RecruiterLayout.jsx (Recruiter Portal)
                    └── components/ (Jobs, Candidates, PostJob, Company, EditJobModal)
```
All feature components obtain the backend base URL + auth headers exclusively through `services/apiClient.apiFetch` (no inline `fetch`), and all direct-to-S3 PUTs go through `services/uploadService.putFileToS3` (the video showcase keeps its XHR PUT for progress). `ConnectionLoader.jsx` keeps a direct `/health` ping (outside the `/api` namespace).

### Backend Dependency Chain
```
src/index.js
  └── src/routes/api.js
        ├── src/middleware/auth.js (JWT validation)
        └── src/controllers/ (HTTP only)
              ├── auth.controller.js
              ├── student.controller.js ─┐
              ├── recruiter.controller.js┤
              │     ├── src/services/skillMatching.service.js ── src/constants/technicalSkills.js
              │     ├── src/services/jobLifecycle.service.js
              │     ├── src/services/fileCleanup.service.js ──── src/config/s3.js
              │     └── src/services/mcq/mcqService.js ── providers/{bedrock,groq}Provider.js + prompts.js
              │     (all controllers → src/config/db.js → src/config/mock/{mockClient,seed}.js / prisma/schema.prisma)
              └── upload.controller.js
                    ├── src/utils/fileSignature.js (magic bytes)
                    └── src/config/s3.js (AWS S3 storage helpers)
```

---

## 5. API Map

### Public Auth Endpoints
* **`POST /api/auth/signup`**
  - **Purpose**: Creates Student Profile or Recruiter Company structure.
  - **Files**: `auth.controller.js`, `api.js`
* **`POST /api/auth/login`**
  - **Purpose**: Validates email/password credentials and issues token. Accepts optional `role` parameter ('STUDENT' or 'RECRUITER') to enforce portal-specific login access and prevent cross-role authentication.
  - **Files**: `auth.controller.js`, `auth.validator.js`, `api.js`

### Student Endpoints (Bearer JWT Required)
* **`GET /api/student/profile`**
  - **Purpose**: Fetches candidate's self-rating skills list.
  - **Files**: `student.controller.js`, `api.js`
* **`PUT /api/student/profile`**
  - **Purpose**: Updates candidate name, resume link, and skill parameters.
  - **Files**: `student.controller.js`, `api.js`
* **`POST /api/student/resume/parse`**
  - **Purpose**: Downloads and parses uploaded resume PDF/DOCX files offline using rule-based parsing.
  - **Files**: `student.controller.js`, `api.js`
* **`GET /api/student/jobs`**
  - **Purpose**: Fetches active jobs and parses requirement matching statuses.
  - **Files**: `student.controller.js`, `api.js`
* **`POST /api/student/jobs/:jobId/apply`**
  - **Purpose**: Submits application. Blocks request if candidate is below threshold.
  - **Files**: `student.controller.js`, `api.js`
* **`POST /api/student/tests`**
  - **Purpose**: Records verification test scores. Upgrades profile skill level on pass.
  - **Files**: `student.controller.js`, `api.js`
* **`GET /api/student/jobs/:jobId/public`**
  - **Purpose**: Fetches complete job and company brief for unauthenticated public preview. Validates 24-character hex MongoDB ObjectId format, returning 404 for nonexistent/closed jobs.
  - **Files**: `student.controller.js`, `student.routes.js`

### Recruiter Endpoints (Bearer JWT Required)
* **`GET /api/recruiter/company`**
  - **Purpose**: Fetches recruiter profile and verification tier.
  - **Files**: `recruiter.controller.js`, `api.js`
* **`POST /api/recruiter/verify`**
  - **Purpose**: Simulates company verification document audit.
  - **Files**: `recruiter.controller.js`, `api.js`
* **`POST /api/recruiter/jobs`**
  - **Purpose**: Publishes opportunity with threshold skill requirements.
  - **Files**: `recruiter.controller.js`, `api.js`
* **`GET /api/recruiter/jobs`**
  - **Purpose**: Lists posted roles and details of candidates who applied.
  - **Files**: `recruiter.controller.js`, `api.js`
* **`GET /api/recruiter/candidates`**
  - **Purpose**: Lists all candidate profiles.
  - **Files**: `recruiter.controller.js`, `api.js`
* **`GET /api/recruiter/top-talents`**
  - **Purpose**: Returns ranked candidates for the Recruiter Dashboard "Top Matching Talents" section based on an on-the-fly Recruiter Demand Profile computed across the recruiter's active jobs.
  - **Files**: `recruiter.controller.js`, `recruiter.routes.js`, `skillMatching.service.js`

### Gigs Endpoints (Bearer JWT Required)
* **`POST /api/gigs`**
  - **Purpose**: Publishes a new gig task with per-skill required proficiency rating thresholds (`requirements: [{ skillName, minRating }]`). Recruiter only.
  - **Files**: `gig.controller.js`, `api.js`, `gig.validator.js`
* **`GET /api/gigs`**
  - **Purpose**: Lists and filters active marketplace gigs.
  - **Files**: `gig.controller.js`, `api.js`
* **`GET /api/gigs/my-workspace`**
  - **Purpose**: Lists user's involved gigs (hired for students, owned for recruiters).
  - **Files**: `gig.controller.js`, `api.js`
* **`GET /api/gigs/:gigId`**
  - **Purpose**: Retrieves full details, pitches, chat messages, and deliverables of a gig.
  - **Files**: `gig.controller.js`, `api.js`
* **`PUT /api/gigs/:gigId`**
  - **Purpose**: Modifies open/paused gig parameters (description, requirements, skills, budget, currency, deliveryTime, attachments, logo). Title and Category of Field are strictly immutable after gig creation. Recruiter only.
  - **Files**: `gig.controller.js`, `api.js`, `gig.validator.js`
* **`PATCH /api/gigs/:gigId/status`**
  - **Purpose**: Toggles status of owned gig between OPEN and PAUSED. Recruiter only.
  - **Files**: `gig.controller.js`, `api.js`
* **`DELETE /api/gigs/:gigId`**
  - **Purpose**: Removes open/paused gig and cascaded applications. Recruiter only.
  - **Files**: `gig.controller.js`, `api.js`
* **`POST /api/gigs/:gigId/apply`**
  - **Purpose**: Submits candidate pitch application for a gig with optional work sample image attachments (max 2MB, uploaded to AWS S3). Enforces student per-skill rating eligibility (`candidateSkillRating >= requirement.minRating`); candidates falling short on any required skill are gated with a prompt listing missing skills and directing to take skill tests. Student only.
  - **Files**: `gig.controller.js`, `api.js`
* **`POST /api/gigs/:gigId/select`**
  - **Purpose**: Hires selected candidate for gig and updates status to IN_PROGRESS. Applicants are retained to allow recruiters to view alternative pitches and communicate via the "View Rest of Candidates" workspace modal. Recruiter only.
  - **Files**: `gig.controller.js`, `api.js`
* **`POST /api/gigs/:gigId/reject`**
  - **Purpose**: Rejects and removes a candidate's application for a gig. Recruiter only.
  - **Files**: `gig.controller.js`, `api.js`
* **`POST /api/gigs/:gigId/chat`**
  - **Purpose**: Sends chat message in workspace room. Accepts optional `receiverId` to route messages directly to specific candidates.
  - **Files**: `gig.controller.js`, `api.js`
* **`POST /api/gigs/:gigId/deliverable`**
  - **Purpose**: Submits completed deliverable description/link. Student only.
  - **Files**: `gig.controller.js`, `api.js`
* **`POST /api/gigs/:gigId/accept`**
  - **Purpose**: Accepts student work, completes gig, rates/reviews candidate, and adds verified project to student profile. Recruiter only.
  - **Files**: `gig.controller.js`, `api.js`
* **`POST /api/gigs/:gigId/revision`**
  - **Purpose**: Requests revisions on submitted deliverable. Recruiter only.
  - **Files**: `gig.controller.js`, `api.js`
* **`POST /api/gigs/:gigId/feedback`**
  - **Purpose**: Rates/reviews recruiter client after gig completion. Student only.
  - **Files**: `gig.controller.js`, `api.js`

### Upload Endpoints (Bearer JWT Required)
* **`POST /api/upload/request-url`**
  - **Purpose**: Generates S3 pre-signed upload URL for files (resume, video, doc).
  - **Files**: `upload.controller.js`, `api.js`

### Admin Portal Endpoints (Runs on Port 5002)
* **`GET /api/dashboard/stats`**
  - **Purpose**: Gathers global platform statistics (totals and recent users).
  - **Files**: `dashboard.controller.js`, `dashboard.routes.js`
* **`GET /api/student`**
  - **Purpose**: Lists all registered student candidates with their full profiles and tests history.
  - **Files**: `student.controller.js`, `student.routes.js`
* **`GET /api/recruiter`**
  - **Purpose**: Lists all recruiters matched with company verification assets and posted job summaries.
  - **Files**: `recruiter.controller.js`, `recruiter.routes.js`
* **`GET /api/job`**
  - **Purpose**: Retrieves all active opportunities on the platform.
  - **Files**: `job.controller.js`, `job.routes.js`
* **`GET /api/job/:jobId/applicants`**
  - **Purpose**: Retrieves all candidates who applied to the specified job.
  - **Files**: `job.controller.js`, `job.routes.js`
* **`GET /api/storage/explorer`**
  - **Purpose**: Gathers S3 bucket directory listings alongside MongoDB serverless storage size measurements.
  - **Files**: `storage.controller.js`, `storage.routes.js`
* **`GET /api/analytics`**
  - **Purpose**: Resolves recruiter skills demand ranking and student profile preferences metrics.
  - **Files**: `analytics.controller.js`, `analytics.routes.js`

---

## 6. Database Map (MongoDB Schema via Prisma)

* **`User`**
  - `id`: ObjectId String (Primary Key)
  - `email`: String (Unique)
  - `password`: Hashed String
  - `role`: String ("STUDENT" or "RECRUITER")
  - `regNo`: String (Unique registration number, e.g. CAN001, REC001)
  - `createdAt`: DateTime
* **`Profile`** (Student Details)
  - `id`: ObjectId String (Primary Key)
  - `userId`: ObjectId String (Unique Reference)
  - `name`: String
  - `resumeUrl`: String (Optional)
  - `introVideoUrl`: String (Optional link to Supabase video)
  - `skills`: Array of embedded `Skill` objects:
    * `name`: String
    * `rating`: Integer
  - `bio`: String (Optional)
  - `nationality`: String (Optional)
  - `gender`: String (Optional)
  - `email`: String (Optional)
  - `dob`: String (Optional)
  - `phone`: String (Optional)
  - `socialLinks`: Embedded `SocialLinks` object:
    * linkedin, github, hackerEarth, hackerRank, codechef, leetcode, codeforces, kaggle, portfolio
    * showLinkedin, showGithub, showHackerEarth, showHackerRank, showCodechef, showLeetcode, showCodeforces, showKaggle, showPortfolio
  - `education`: Array of embedded `Education` objects
  - `experience`: Array of embedded `Experience` objects
  - `certificates`: Array of embedded `Certificate` objects
  - `projects`: Array of embedded `Project` objects
  - `cocurricular`: String (Optional drive link)
* **`Company`** (Recruiter Details)
  - `id`: ObjectId String (Primary Key)
  - `userId`: ObjectId String (Unique Reference)
  - `name`: String
  - `docUrl`: String (Optional)
  - `verified`: Boolean (Default: false)
* **`Job`**
  - `id`: ObjectId String (Primary Key)
  - `companyId`: ObjectId String
  - `title`: String
  - `description`: String
  - `opportunityType`: String (Optional, e.g. "JOB", "INTERNSHIP", "GIG", default: "JOB")
  - `companyName`: String (Optional)
  - `officialWebsite`: String (Optional)
  - `preferredEducation`: String (Optional)
  - `desiredExperience`: String (Optional)
  - `designation`: String (Optional)
  - `stipendPartTime`: String (Optional)
  - `stipendFullTime`: String (Optional)
  - `duration`: String (Optional)
  - `roleResponsibilities`: String (Optional)
  - `location`: String (Optional)
  - `locationUrl`: String (Optional)
  - `activeDays`: Integer (Optional, default: 30)
  - `joiningMonth`: String (Optional)
  - `openings`: Integer (Optional)
  - `selectionProcess`: Array of embedded `ProcessRound` objects:
    * `roundNumber`: Integer
    * `name`: String
    * `description`: String
  - `requirements`: Array of embedded `JobRequirement` objects:
    * `skillName`: String
    * `minRating`: Integer
  - `createdAt`: DateTime

* **`Application`**
  - `id`: ObjectId String (Primary Key)
  - `jobId`: ObjectId String
  - `studentId`: ObjectId String
  - `status`: String (Default: "APPLIED")
  - `createdAt`: DateTime
* **`TestAttempt`**
  - `id`: ObjectId String (Primary Key)
  - `profileId`: ObjectId String
  - `skillName`: String
  - `score`: Integer
  - `passed`: Boolean
  - `createdAt`: DateTime
* **`Gig`**
  - `id`: ObjectId String (Primary Key)
  - `ownerId`: ObjectId String (Recruiter User)
  - `title`: String
  - `description`: String
  - `logo`: String (Optional URL for gig/company logo)
  - `category`: String (Optional)
  - `categories`: Array of Strings
  - `skills`: Array of Strings
  - `budget`: Float
  - `deliveryTime`: String
  - `attachments`: Array of Strings
  - `status`: String ("OPEN", "PAUSED", "IN_PROGRESS", "COMPLETED", default: "OPEN")
  - `selectedCandidateId`: ObjectId String (Student User, optional)
  - `hiredCandidateIds`: Array of ObjectId Strings
  - `createdAt`: DateTime
  - `updatedAt`: DateTime
* **`GigPitch`**
  - `id`: ObjectId String (Primary Key)
  - `gigId`: ObjectId String
  - `candidateId`: ObjectId String (Student User)
  - `pitchText`: String
  - `budget`: Float
  - `deliveryTime`: String
  - `createdAt`: DateTime
* **`GigDeliverable`**
  - `id`: ObjectId String (Primary Key)
  - `gigId`: ObjectId String
  - `description`: String
  - `attachmentUrl`: String (Optional)
  - `status`: String ("SUBMITTED", "ACCEPTED", "REJECTED")
  - `feedback`: String (Optional, revision feedback from client)
  - `createdAt`: DateTime
* **`GigFeedback`**
  - `id`: ObjectId String (Primary Key)
  - `gigId`: ObjectId String
  - `raterId`: ObjectId String
  - `rateeId`: ObjectId String
  - `rating`: Integer
  - `review`: String
  - `createdAt`: DateTime

---

## 7. Environment Variables

* **`DATABASE_URL`**: MongoDB connection string with replica set enabled (`mongodb://...`). Defaults to local in development but is bypassed by the mock datastore if not matching a remote cluster.
* **`JWT_SECRET`**: Phrase used to sign and verify authorization tokens.
* **`PORT`**: Network port the backend Express server binds to (default: `5001`).
* **`AWS_ACCESS_KEY_ID`**: Access credential of S3 user.
* **`AWS_SECRET_ACCESS_KEY`**: Secret key of S3 user.
* **`AWS_REGION`**: AWS target region location (e.g. `ap-south-1`).
* **`S3_BUCKET_NAME`**: Name of the target S3 bucket where file objects are saved.

---

## 8. Important Entry Points
* **Backend Dev Entry**: `backend/src/index.js`
* **Frontend Dev Entry**: `frontend/src/main.jsx`
* **Root Instructions**: `README.md`
* **Root Dev Workspace Runner**: `package.json`
* **Git Commit Summary Documentation**: `commit.md`

---

## 9. Search Index (Task-to-File Routing)

* **Task: Change UI Theme, Color Tokens, or Neumorphic Depth**
  - Files: `frontend/src/index.css` (all `--c-*` tokens + `--neu-*`/`--shadow-*` depth vars, light in `:root`, dark in `.dark`; `.glass-*`/`.neu-*`/`.led`/`.neu-screws` utilities live here too), `frontend/src/components/ui/*` (shared primitives — restyle here to change the look app-wide), `frontend/tailwind.config.js` (font families only), `frontend/index.html` (Google Fonts link)
  - Note: components must use semantic token classes (`bg-primary`, `text-on-surface`, etc.) and shadow utilities (`shadow-[var(--shadow-card)]`) — never hardcoded hex/zinc utilities. Design is Industrial Skeuomorphism; safety-orange (`--c-primary`) is the accent, tertiary amber is reserved for certification/upgrade CTAs, secondary is charcoal. To restyle depth globally, edit the `--shadow-*` vars once. Note: `hover:`/`focus:` variants only work on Tailwind utilities — use `hover:shadow-[var(--shadow-floating)]`, not `hover:neu-floating` (the `.neu-*` classes are plain CSS, valid only when applied statically).
* **Task: Add New Test Question / Modify Quiz Scoring**
  - Files: `frontend/src/features/SkillTest/TestView.jsx` or `frontend/src/features/Student/components/StudentSkillTests.jsx`
* **Task: Alter Job Matching Algorithm Logic**
  - Files: `backend/src/services/skillMatching.service.js` (`buildStudentSkillMap`/`getMissingRequirements`); `TECHNICAL_SKILLS` in `backend/src/constants/technicalSkills.js`. Consumed by `student.controller.js` `getJobs`/`applyJob`.
* **Task: Change MCQ Generation (providers/prompts/fallback)**
  - Files: `backend/src/services/mcq/mcqService.js` (orchestration), `providers/{bedrock,groq}Provider.js`, `prompts.js`.
* **Task: Change Frontend API base URL / auth header / add an endpoint call**
  - Files: `frontend/src/config/index.js` (`API_BASE`), `frontend/src/services/apiClient.js` (`apiFetch`); admin: `admin_ws/frontend/src/api/adminApi.js`.
* **Task: Change admin storage/billing computation**
  - Files: `admin_ws/backend/src/services/{s3Storage,mongoStorage}.service.js`, `utils/formatBytes.js`, `mocks/storage.mock.js`.
* **Task: Modify Gigs Marketplace & Single Unified Chassis Workspace Layout**
  - Files: `frontend/src/features/Gigs/pages/GigsMarketplace.jsx` (Single unified container chassis layout: Panel 1 Left = Hosted Gigs list with quick-add button; Panel 2 Center = Gig Header with status pill, View Brief modal trigger, recruiter controls, key metrics row, active candidate action subheader with Submission and Profile Info triggers, and live chat feed; Panel 3 Right = Assigned Talent / Hired candidates + Submission/Feedback room alongside Awaiting Review pitches feed; clicking unreviewed pitch opens candidate pitch modal with "Know About Candidate" profile button, pitch note, attachments, Hire & Reject controls), `frontend/src/features/Recruiter/components/CandidateProfileModal.jsx` (candidate profile modal), `backend/src/modules/gigs/gig.controller.js` (continuous application flow allowing multiple simultaneous applications stored independently until explicitly CLOSED or PAUSED, candidate retention post-hiring, candidate rejection, receiverId messaging), `backend/src/infrastructure/database/` (MongoDB connection & mockClient proxy), `backend/prisma/schema.prisma` (`GigMessage.receiverId` model).
* **Task: Adjust Mock / Seeding Records**
  - Files: `backend/src/config/mock/seed.js` (fixtures) and `backend/src/config/mock/mockClient.js` (query methods)

---

## 10. Change Frequency List
* **High Change Frequency**:
  - `frontend/src/features/Student/components/`
  - `backend/src/controllers/student.controller.js`
* **Medium Change Frequency**:
  - `frontend/src/features/Recruiter/components/`
  - `backend/src/routes/api.js`
  - `backend/src/config/db.js`
  - `backend/src/controllers/recruiter.controller.js`
  - `backend/prisma/schema.prisma`
* **Low Change Frequency**:
  - `frontend/src/App.jsx`
  - `backend/src/index.js`
  - `frontend/tailwind.config.js`
  - `frontend/src/index.css`
  - `frontend/index.html`

---

## 11. Architecture Rules
* **Frontend stack is strictly React JavaScript + Tailwind CSS**. No TypeScript inside the frontend folder.
* **Backend stack is Node.js JavaScript (strictly CommonJS `require` syntax)**. No ES6 import modules.
* **Prisma schema uses MongoDB provider**. All queries run using async/await patterns.
* **No external CSS file imports or UI styling libraries** (like Material-UI, Bootstrap, etc.). Design configurations must remain pure Tailwind.
* **Zero UI placeholder text**; all data components must bind to real mock or live database datasets.
* **Admin Workspace (admin_ws) is fully self-contained**:
  - The admin portal frontend runs on port `5174` (main client app runs on `5173`).
  - The admin portal backend runs on port `5002` (main backend runs on `5001`).
  - Uses native `mongodb` driver directly inside `admin_ws/backend` to avoid compiler dependencies on main Prisma clients.

---

## 12. Rate Limiting System

The application enforces production-ready rate limiting at the API route level in both `backend` and `admin_ws/backend`.

* **Unified Configuration**:
  - `backend/src/config/rateLimit.config.js`: Configures auth limits (strict), public limits (moderate), and authenticated limits (relaxed).
  - `admin_ws/backend/src/config/rateLimit.config.js`: Configures relaxed administrative limits.
* **Brute Force Protection (Failed Login Attempts)**:
  - Strict rate limits protect the email/password login and signup routes.
  - Implements **progressive/exponential backoff** for repeated login failures: lock delay increases exponentially on consecutive failures per IP and per Email account to protect against brute force and credential stuffing.
  - State is tracked in-memory using highly efficient maps with self-cleaning timer loops to prevent memory leaks.
  - Successful login attempts automatically call `resetFailedAttempts` to clear any lock state.

---

## 13. Input Validation System

The application enforces production-ready schema validation using `zod` at the API route level in both `backend` and `admin_ws/backend`.

* **Validation Middleware**:
  - `backend/src/middleware/validate.js`: Validation coordinator that parses and extracts `req.body`, `req.params`, or `req.query` schemas, rejecting invalid requests immediately with a detailed field-specific HTTP 400 validation error list.
  - `admin_ws/backend/src/middleware/validate.js`: Equivalent validation coordinator in the Admin Portal.
* **Validation Schema Files**:
  - `backend/src/validators/auth.validator.js`: Validates login credentials and signup payloads (length, format).
  - `backend/src/validators/student.validator.js`: Validates nested student profiles, experience arrays, certifications, education structures, age checks (>= 17), and technical quiz records.
  - `backend/src/validators/recruiter.validator.js`: Validates job postings, requirements arrays, selection processes, and company trust credentials.
  - `backend/src/validators/upload.validator.js`: Validates pre-signed file upload requests.
  - `admin_ws/backend/src/validators/job.validator.js`: Validates that incoming jobId path parameters conform to a strict 24-character hexadecimal ObjectId format.

---

## 14. Secrets Management & Credential Security

The application uses secure, centralized configuration files to load secrets and environment variables, with strict verification checks.

* **Ignored Secrets Configuration**:
  - All sensitive `.env` files are ignored by git (`.gitignore` root rule). Only `.env.example` templates containing placeholders are tracked.
* **Fail-Fast Boot Execution**:
  - `backend/src/config/env.js`: Centralized configuration module loading and validating required secrets (`DATABASE_URL`, `JWT_SECRET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). If any key is missing in production mode (`NODE_ENV=production`), the application throws a fatal configuration error on startup to fail-fast.
  - `admin_ws/backend/src/config/env.js`: Centralized configuration module enforcing matching fail-fast validation in the Admin Portal.
* **Hardcoded Secret Elimination**:
  - Removed all hardcoded fallback secrets inside controller files and auth middlewares, routing JWT token signs/verifications strictly through `env.JWT_SECRET`.

---

## 15. Dependency Security Status

The project runs a verified, vulnerability-free dependency environment.

* **Audit Mappings**:
  - Main Backend (`backend/`): 0 known vulnerabilities across 149 packages.
  - Main Frontend (`frontend/`): 0 known vulnerabilities across 218 packages.
  - Admin Backend (`admin_ws/backend/`): 0 known vulnerabilities across 153 packages.
  - Admin Frontend (`admin_ws/frontend/`): 0 known vulnerabilities across 88 packages.
* **Audit Enforcement**:
  - Periodic scans are conducted on all direct and transitive dependency packages. Any new libraries or updates must maintain full compatibility with React, Express, MongoDB, Prisma, and AWS SDK.

---

## 16. Centralized Error Handling System

Both backend applications run centralized unhandled error interception middlewares to avoid system leakages.

* **Centralized Error Handlers**:
  - `backend/src/middleware/errorHandler.js`: Catches unhandled exceptions in the main backend, formats response payloads according to `{ error: message }`, and outputs complete server-side logs for diagnostics.
  - `admin_ws/backend/src/middleware/errorHandler.js`: Intercepts and captures errors in the Admin Portal, responding using the `{ success: false, error: message }` format.
* **Information Leakage Protection**:
  - In production mode (`NODE_ENV=production`), both modules mask raw 5xx internal server exceptions (like database queries, AWS bucket failures, filesystem paths, and code parameters) with a generic, user-friendly message (`"An unexpected error occurred on the server. Please try again later."`) to prevent structural exposure to clients.
  - Operational or 4xx client validation errors are passed directly to provide clean, contextual assistance.

---

## 17. File Upload Security System

The main backend enforces server-mediated uploads, validating parameters, sizes, and content signatures on the server before files reach AWS S3 storage.

* **Server-Mediated Proxy Interceptor**:
  - Instead of direct client-to-S3 uploads, `/upload/request-url` and `/student/video-upload-url` return a local server route: `/api/upload/secure-put` with the target file configuration passed via parameters.
  - `backend/src/index.js` mounts `express.raw` parser for this route specifically to capture the file binary directly into memory buffer.
  - `backend/src/controllers/upload.controller.js` parses the buffer, checks constraints, validates headers, and calls `uploadBuffer` in `backend/src/config/s3.js` to upload the clean binary to S3.
* **Upload Configuration & Limits**:
  - `backend/src/config/upload.config.js`: Centralizes max size limits (e.g. 10MB resume, 2MB image, 50MB video) and allowed MIME type lists (PDF, JPEG, PNG, MP4, WebM).
* **Binary Magic Bytes Signature Check**:
  - Files are validated by checking their actual binary signature (magic bytes) at the head of the buffer: PDF (`25504446`), PNG (`89504E47`), JPEG (`FFD8FF`), MP4 (`66747970`), WebM (`1A45DFA3`). Files with spoofed extensions or corrupted contents are rejected with HTTP 400. The check itself lives in `backend/src/utils/fileSignature.js` (`validateMagicBytes`); `upload.controller.js` imports it.
* **Isolation & Non-Executability**:
  - All files are saved inside isolated S3 buckets under secure folder patterns (`resumes/`, `images/`, `videos/`, `docs/`) using unique user-linked timestamps. AWS S3 does not compile or execute stored files as application code.
* **Admin Portal uploads status**:
  - The Admin Portal backend (`admin_ws/backend/`) does not contain any file upload routes. If added, they must implement matching server-mediated validation checks.

---

## 18. SOLID Refactoring (Internal Architecture, No Behavior Change)

A structural refactoring separated concerns per SOLID without altering any route, contract, query, calculation, auth, env var, or UI. Controllers/components became thinner; logic/data/integrations moved into focused modules. **The three apps stay independent — no new cross-imports between `backend/`, `frontend/`, and `admin_ws/`.**

* **Backend (SRP/DIP/OCP)**:
  - Controllers are now HTTP-only; business/integration logic lives in `backend/src/services/` (`skillMatching`, `jobLifecycle`, `fileCleanup`, `mcq/` with Bedrock/Groq providers behind a common contract — OCP).
  - `TECHNICAL_SKILLS` → `backend/src/constants/technicalSkills.js`; magic-byte check → `backend/src/utils/fileSignature.js`.
  - The mock persistence engine + seed fixtures were split out of `config/db.js` into `config/mock/{mockClient,seed}.js`; `db.js` keeps only client init + proxy + connection-fallback (SRP). Public export (`{ prisma, isMock }`) unchanged.
* **Frontend (DIP/DRY/SRP)**:
  - New `src/services/apiClient.js` (`apiFetch`) is the single seam for base-URL + auth headers; **all ~26 inline `fetch` call sites were migrated** through it. `src/services/uploadService.js` (`putFileToS3`) dedups the S3 PUT step. `src/services/resumePdf.js` isolates html2canvas/jsPDF.
  - `API_BASE` moved to `src/config/`; `ALL_SKILLS`/`DOMAIN_OPTIONS`/`TEST_QUESTIONS` moved to `src/constants/{skills,domains,testQuestions}.js`; `src/constants/index.js` is a backward-compat barrel. Student completeness rules → `src/utils/profileCompleteness.js`.
* **admin_ws (self-contained, SRP/DRY)**:
  - `storage.controller.js` split into `services/{s3Storage,mongoStorage}.service.js` + `mocks/storage.mock.js` + `utils/formatBytes.js` + `config/s3.js`; the controller only orchestrates + shapes the response.
  - `config/database.js` gained `getDbSafe()` (non-throwing) which replaced the duplicated `try/getDB/catch` guard across all six controllers. Admin frontend `fetch`es go through `frontend/src/api/adminApi.js`.
* **Deliberately preserved quirks** (behavior-parity, not "fixed"): `saveIntroVideo` reads `introVideoUrl` while its validator names `videoUrl`; `submitTest` vs `submitSkillTest` rating-scale differences; `mockClient` lacking `application.update`; the duplicate `Tailwind` entry in `ALL_SKILLS`; dashboard's `'0.00 KB'`/`'84.5 MB'` byte fallbacks (kept distinct from storage's `formatBytes`).
* **Deferred (not done — future follow-ups)**: JSX-tree decomposition of the large presentational components (`frontend` `StudentProfile.jsx` ~1904, `AuthView.jsx` ~1303, `StudentLayout.jsx` shell, and `admin_ws` `App.jsx` ~1661) into sub-components, and a shared `JobForm`/`PortalShell`. These were intentionally left intact because splitting 1300–1900-line render trees carries behavior-drift risk that outweighs the benefit under the strict no-behavior-change mandate; their non-JSX concerns (network, data, PDF, completeness rules) were already extracted. The `errorHandler`/`asyncHandler` unification was also skipped to preserve each handler's exact 500-response messages.


---

## 19. Question Bank Subsystem — Architecture (pre-generated bank)

Design spec: `docs/superpowers/specs/2026-07-21-question-bank-architecture-design.md`
(supersedes the archived enterprise spec `docs/superpowers/archive/2026-07-18-question-bank-spine-design.md`)
Kept implementation records: `plans/2026-07-18-skill-registry-foundation.md` (registry),
`plans/2026-07-20-testsession-security.md` (assessment security).
Session handoff: `CONTINUATION.md` · Roadmap: `task.md`

### Goal

Serve candidates pre-generated, validated MCQs from MongoDB — **no LLM on the assessment hot path**
(with a runtime fallback for uncovered skills). Generation, roadmaps, lifecycle, and replacement are
offline/administrative concerns, decoupled from the candidate request path.

### The enterprise pipeline is deprecated (2026-07-21)

An earlier design (2026-07-18) specced an *Enterprise Question Bank Management System*: a blueprint
engine, an offline generation **worker** driven by a `GenerationJob` queue, embedding-based dedup
(Bedrock Titan + cosine), a batched reviewer pass with human review flags, and three admin
dashboards. **That program was deprecated and never built** — no such models, workers, queues, or
`similarity/` code ever entered the codebase (verified: none in `backend/` or `admin_ws/`, no queue
or embedding dependency in `package.json`). It is replaced by the simpler architecture below.
`admin_ws/` is a standalone admin portal with no generation-pipeline code.

### Architecture (7 parts)

1. **Skill catalog** — the 143 canonical skills in the `SkillDefinition` registry (source of truth;
   `seedData.json` is its seed data). Roadmaps/questions are generated for canonical skills only, never aliases.
2. **AI-assisted skill roadmap** — per skill, an ordered 10-15 subtopic interview syllabus generated
   via the provider chain (Claude on Bedrock → Groq fallback), stored in `SkillRoadmap`. **DONE (Phase 2): 143/143.**
3. **AI-assisted question generation** — per (skill, subtopic), MCQs via the same providers, stored
   in `Question`. (Interim bank exists; roadmap-driven generation is Phase 3, not yet built.)
4. **Question lifecycle** — simple `status` (ACTIVE/RETIRED/FLAGGED); only ACTIVE is served. Design only.
5. **Usage tracking** — per-question serve/answer counters. Design only.
6. **Intelligent replacement** — regenerate + retire overused/flagged questions. Design only.
7. **Assessment serve/score** — `TestSession` (Plan 2): server-side scoring, answer key never sent,
   70% pass, single-use expiring sessions. Built + kept.

### Kept decisions (still binding)

| Decision | Rationale |
|---|---|
| **DB-backed `SkillDefinition` registry** is the source of truth for skill identity (aliases consolidated) | Canonical names + alias resolution feed both job matching and roadmap/question generation. Wired into `skillMatching.service.js`. |
| **Bank-first serve with runtime LLM fallback** | No student-facing regression; coverage is a dial, not a launch gate. |
| **Provider-agnostic generation** via an orchestrator (Claude on Bedrock → Groq) | Switching providers is a one-module change; no HTTP coupling; **no new providers introduced**. |
| **Repositories are the only place Prisma is touched** under `services/questionBank/` | Keeps generation/validation logic pure and unit-testable. |

### Phases

- **Phase 0 (migration, 2026-07-21):** deprecate the enterprise pipeline (docs only — no pipeline code existed); keep the registry, interim bank, Plan 2 security, and the mcq providers.
- **Phase 1 (roadmap storage):** `SkillRoadmap` model + mock support + validator + seed + verify harness. **DONE.**
- **Phase 2 (roadmap generation):** rank 143 canonical skills, generate 10-15 subtopics each, persist immediately, resumable, verify. **DONE — 143/143** (workflow below).
- **Phase 3 (question generation):** roadmap-driven MCQ generation. **NOT STARTED (awaiting approval).**

### Skill roadmap generation workflow (Phase 2, DONE)

- **Ranking:** `backend/scripts/skillRanking.json` — curated 1..143 popularity order (Python #1 …),
  reconciled against the canonical set (missing skills appended by tier→name). Determines generation
  order and each roadmap's `popularityRank`.
- **Generation:** `scripts/generateRoadmaps.js` → `services/questionBank/roadmap/roadmapService.js`
  (orchestrator) → `roadmap/providers/{bedrockProvider,groqProvider}.js`; prompts in
  `roadmap/prompts.js`. Bedrock (Claude Haiku) is primary but **403 billing-blocked**, so the run
  fell back to Groq `llama-3.3-70b-versatile`. Concurrency (`GEN_CONCURRENCY`, default 3) + 429 retry.
- **Persistence (immediate + resumable):** every valid roadmap is written to
  `scripts/output/roadmaps.json` the instant it is generated; a rerun **skips any skill that already
  has a valid roadmap** (`--force` to regenerate). Progress is never lost on interruption — the run
  that rate-limited on Pinecone was completed by a plain rerun. DB persistence is the human-run
  `seedRoadmaps.js --commit` (mock-verified by the agent; prod is human-only, BLOCKER 1).
- **Validation:** `roadmap/validate.js` (`validateRoadmap`/`validateRoadmapSet`) enforces 10-15
  deduped subtopics, unique contiguous 1..N ranks, and full canonical coverage. 10 unit tests +
  `scripts/verifyRoadmapFlow.js` (mock seed→read roundtrip).
- **Result:** 143/143 roadmaps, subtopics 12-14 (avg 13.3), all verification checks PASS.

### Legacy registry fields (unused)

`SkillDefinition.counters` (`SkillCounters`), the generation-lifecycle `status` values
(`GENERATING/PAUSED/REVIEWING/COMPLETED/PUBLISHED`), and `targetQuestionCount` were part of the
deprecated pipeline. They remain on the model (harmless — unwritten except `targetQuestionCount` at
seed time, unread) and may be simplified/repurposed when the Phase 4+ lifecycle is built. `tier`
still informs the ranking tiebreak.

### Skill registry specifics

- Seeded from **`frontend/src/constants/skills.js` (`ALL_SKILLS`)**, not the backend `TECHNICAL_SKILLS` set — `ALL_SKILLS` carries display casing and a `technical`/`non-technical` flag. Only `technical` entries get rows.
- After seeding, **`backend/src/constants/technicalSkills.js` and `frontend/src/constants/skills.js` are LEGACY.** The database is the source of truth.
- `backend/scripts/generateSkillSeed.js` is a **one-time importer**; its output `seedData.json` is committed and reviewed. It parses the frontend file as text (the frontend is ESM in a separate npm project and cannot be `require`d).
- The parser **must skip `//`-commented lines.** Four skills are commented out in the frontend list (CSS, GenAI, Next JS, React); scraping them resurrects deliberately-disabled entries.
- **`React` is added explicitly via `EXTRA_SKILLS`** — it is commented out in the frontend list but live in backend `TECHNICAL_SKILLS`, and is a Tier 1 skill. Same for `Redis` and `GraphQL`, absent from both lists.
- **Normalization has two mechanisms and neither subsumes the other.** `normalizeToken()` folds *punctuation* variants (`Next.js` ≡ `next js`); explicit `aliases[]` fold *semantic* variants (`Data Structure` → `Data Structures & Algorithms`). `+` and `#` are deliberately preserved — `C`, `C++`, `C#` are three distinct skills.
- Current seed result: **143 definitions** — Tier 1 = 9, Tier 2 = 7, Tier 3 = 127.

### Known product bug surfaced by this work

`React` is commented out in `frontend/src/constants/skills.js:138` while `React Native` and
`React Testing Library` remain live, and backend `TECHNICAL_SKILLS` *does* contain `react`. If
`ALL_SKILLS` drives the candidate skill picker, candidates cannot self-rate React while jobs can
require it — a silent matching failure on the single most common frontend skill. **Not yet
investigated or fixed.**

### Security findings (documented, NOT yet fixed)

See spec §3. Both are fixed by the `TestSession` model in Plan 2, which is **independently
shippable** ahead of the rest of the spine.

1. ✅ **RESOLVED 2026-07-20 (Plan 2).** Was: `submitSkillTest` trusted a client `score` with `passed` hardcoded true. Now scores server-side against a single-use `TestSession` answer key; the client submits `{sessionId, answers[]}`, never a score; a rating rises only on a ≥70% pass. The legacy `POST /student/tests` (`submitTest`) client-score path is disabled (410).
2. ✅ **RESOLVED 2026-07-20 (Plan 2).** Was: the answer key shipped to the client. Now `generateSkillTest` stores the key in the `TestSession` and returns options-only questions; correct answers are returned only in the submit response (post-scoring), safe for the review UI.

Note: as of the 2026-07-20 fix there IS a real pass threshold — **70% (7/10)**, computed server-side in `scoring.js` — but it is enforced against the `TestSession` answer key, not taken from the client.

---

## 15. Git Branching & Release Workflow

AlignGrade enforces a dual-branch development and testing workflow to isolate unstable in-progress feature work from the founder/tester release branch.

* **Branch Structure**:
  - `main`: Stable branch dedicated exclusively to founder testing and production releases. Must ALWAYS contain clean, working, tested code. Never commit raw, incomplete, or experimental feature code directly to `main`.
  - `develop`: Active development branch for all ongoing feature work, UI updates, database migrations, and experimental features.
* **Workflow Rules**:
  1. **Active Development**: All new code, features, bug fixes, UI components, and API changes MUST be implemented and committed on `develop`.
  2. **Branch Check Before Task Execution**: Prior to starting any development task, agents/developers MUST verify the active branch (`git branch`). If the current branch is `main` and feature development is attempted, halt and switch to `develop`.
  3. **Release / Merging (`develop` → `main`)**: Merge `develop` into `main` ONLY after features are fully implemented, verified, and ready for founder testing.
  4. **Hotfix Workflow (`main` → `develop`)**: If bugs are reported during testing on `main`:
     - Switch to `main` (`git checkout main`).
     - Implement and test ONLY the specific bug fix.
     - Commit and push to `main`.
     - Immediately merge `main` back into `develop` (`git checkout develop && git merge main`) to ensure both branches remain synchronized.

