# AlignGrade Architecture & Project Memory

This document is the single source of truth for the AlignGrade repository. It defines the folder responsibilities, file mappings, database schema, API routing, dependencies, and rules of development. Future agents should read this file to target specific modifications and bypass full codebase scans.

---

## 1. Project Overview
* **Project Name**: AlignGrade
* **Purpose**: A premium, full-stack recruitment & skill verification platform.
* **Business Objective**: Align candidate self-rated proficiencies with recruiter requirements using automated skill matching. Candidates falling below requirements are locked out from applying but can take interactive certification tests to verify their skills and unlock opportunities.
* **High-Level Architecture**: 
  - **Frontend**: Single Page React Application (Vite + Tailwind CSS v4). Design system: **Industrial Skeuomorphism** (neumorphic "workshop chassis") driven by semantic CSS-variable tokens in `src/index.css` (light + class-based dark mode). Light = matte-plastic chassis `#e0e5ec` with white/`#babecc` shadow pairs; dark = charcoal steel `#2d3436`. Accent (`--c-primary`) is **safety-orange `#ff4757`**, reserved for interactive triggers/LEDs; tertiary amber stays for certification CTAs. Depth comes from the neumorphic shadow vars `--shadow-card / -floating / -pressed / -recessed` (used via `shadow-[var(--shadow-*)]` or the `.neu-raised/-floating/-pressed/-recessed` utility classes). Signature helpers in `index.css`: `.neu-screws` (corner-screw pseudo-element), `.neu-vent`, `.led`/`.led-success`/`.led-tertiary`, body fractal-noise overlay, embossed heading text-shadow. The `.glass-card` / `.glass-button*` class names are retained (for API stability) but re-skinned as neumorphic surfaces — so `Card` and `Button` inherit the look automatically. Typography: Inter (body + headlines via `font-headline`), JetBrains Mono (labels/numeric readouts). Cards/inputs restyled centrally in `src/components/ui/` — feature views inherit the style through those primitives + tokens (no per-feature restyling).
  - **Backend**: Express.js REST API using CommonJS (`require` syntax).
  - **Database & ORM**: MongoDB + Prisma ORM. Auto-configures an in-memory mock database store for seamless offline execution if no MongoDB connection is configured.

---

## 2. Folder Structure
* **`backend/`**
  - **`prisma/`**: Prisma schema definition.
  - **`src/`**: Backend source code.
    - **`config/`**: Database instantiation and mock configurations.
    - **`controllers/`**: Logic controllers (Auth, Student, Recruiter workflows).
    - **`middleware/`**: JWT validation middleware.
    - **`routes/`**: Express Router mappings.
* **`frontend/`**
  - **`public/`**: Static assets.
  - **`src/`**: React files.
    - **`assets/`**: Images and local styles.
  - **`index.html`**: Entry HTML template.
  - **`postcss.config.js`**: PostCSS plugins for Tailwind v4 integration.
  - **`tailwind.config.js`**: Color tokens and font overrides.
  - **`vite.config.js`**: Vite bundler parameters.
* **`admin_ws/`**
  - **`frontend/`**: Vite + React 19 + Tailwind v4 admin portal interface (runs on port `5174`).
    - **`src/`**: Contains dashboard layout, search tables, and action overlays.
      - `App.jsx`: Coordinator for overview cards, students list table, recruiters verification dashboard, jobs list view, and detail inspect modal overlays.
  - **`backend/`**: Node.js + Express admin backend server (runs on port `5002`).
    - `app.js`: Server setup loading routes for `/api/dashboard`, `/api/student`, `/api/recruiter`, `/api/job`.
    - **`src/controllers/`**: Database controller handlers mapping direct MongoDB queries.
      - `dashboard.controller.js`: Tallies platform-wide statistics.
      - `student.controller.js`: Returns student profile data.
      - `recruiter.controller.js`: Returns companies metadata and jobs list.
      - `job.controller.js`: Exposes job descriptions and applicant candidate lists.
    - **`src/routes/`**: Express route maps routing APIs.
  - **`shared/`**: Shared constants, types, schemas, and permissions utilities.
  - **`docs/`**: Admin portal deployment, API, architecture, and database reference guides.
  - **`package.json`**: Root workspace script runner.

---

## 3. File Responsibilities

### Backend Files

#### [backend/prisma/schema.prisma](file:///Users/karanrawat/Desktop/a_g/backend/prisma/schema.prisma)
* **Purpose**: Prisma ORM schema definitions for MongoDB structures.
* **Used By**: Prisma client generator.
* **Dependencies**: None.
* **Safe Modifications**: Appending new fields or schemas to models. Keep type declarations (e.g. `Skill`, `JobRequirement`) compliant with MongoDB.
* **Risk**: High (requires database sync and client regeneration).

#### [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js)
* **Purpose**: DB wrapper instantiating PrismaClient or providing a robust in-memory mock datastore fallback.
* **Used By**: All controllers.
* **Dependencies**: `@prisma/client`.
* **Safe Modifications**: Altering seeded job mock data or mock model methods.
* **Risk**: High (database client availability depend on this).

#### [backend/src/config/s3.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/s3.js)
* **Purpose**: AWS S3 storage client initialization and file operations helper wrapper.
* **Used By**: Upload, student, and recruiter controllers.
* **Dependencies**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
* **Safe Modifications**: Customizing file expiration time limit, adding custom bucket parameters.
* **Risk**: Medium.

#### [backend/src/middleware/auth.js](file:///Users/karanrawat/Desktop/a_g/backend/src/middleware/auth.js)
* **Purpose**: Intercepts request headers, parses the JWT token, and decodes the user payload.
* **Used By**: `backend/src/routes/api.js`.
* **Dependencies**: `jsonwebtoken`.
* **Safe Modifications**: Token formatting, validation error messages.
* **Risk**: High (controls request security).

#### [backend/src/controllers/auth.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/auth.controller.js)
* **Purpose**: Manages Student and Recruiter registrations, hashing passwords, and JWT login sessions.
* **Used By**: `backend/src/routes/api.js`.
* **Dependencies**: `bcryptjs`, `jsonwebtoken`, `backend/src/config/db.js`.
* **Safe Modifications**: Login validation checks, password strength parameters.
* **Risk**: High (user authentication database operations).

#### [backend/src/controllers/student.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/student.controller.js)
* **Purpose**: Core matching logic, candidate profile editing, application status checks, and validation test updates.
* **Used By**: `backend/src/routes/api.js`.
* **Dependencies**: `backend/src/config/db.js`.
* **Safe Modifications**: Rating threshold comparisons, adding skill rating scopes.
* **Risk**: High (business logic calculations).

#### [backend/src/controllers/recruiter.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/recruiter.controller.js)
* **Purpose**: Allows recruiters to list candidates, post jobs, submit verification documents, and retrieve applicant lists.
* **Used By**: `backend/src/routes/api.js`.
* **Dependencies**: `backend/src/config/db.js`.
* **Safe Modifications**: Customizing verification statuses, field additions to job creation parameters.
* **Risk**: High.

#### [backend/src/controllers/upload.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/upload.controller.js)
* **Purpose**: Handles secure pre-signed PUT upload URL generation for client-side direct S3 uploads.
* **Used By**: `backend/src/routes/api.js`.
* **Dependencies**: `backend/src/config/s3.js`.
* **Safe Modifications**: File type constraints, path formatting, key generation naming structures.
* **Risk**: Medium.

#### [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js)
* **Purpose**: Defines route endpoints and assigns auth middlewares and controllers.
* **Used By**: `backend/src/index.js`.
* **Dependencies**: Express Router, controllers, middleware.
* **Safe Modifications**: Exposing new API paths.
* **Risk**: Medium.

#### [backend/src/index.js](file:///Users/karanrawat/Desktop/a_g/backend/src/index.js)
* **Purpose**: Main backend engine entrypoint binding server ports, Express app instance, and core middleware. Configured with a `10mb` json payload limit to support Base64 resume uploads.
* **Used By**: `package.json` scripts.
* **Dependencies**: `express`, `cors`, `dotenv`, `backend/src/routes/api.js`.
* **Safe Modifications**: Global middleware definitions, PORT bindings.
* **Risk**: Low.

---

### Frontend Files

#### [frontend/src/App.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/App.jsx)
* **Purpose**: Coordinates top-level page routing, authentication tokens status checks, and directs either Auth, Student, Recruiter, or Lockdown Test views.
* **Used By**: `frontend/src/main.jsx`.
* **Dependencies**: `react`, features layouts.
* **Safe Modifications**: Root routing rules, global layouts hooks context.
* **Risk**: High (app coordinator).

#### [frontend/src/constants/index.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/constants/index.js)
* **Purpose**: Holds application-wide static constants (`ALL_SKILLS`, `API_BASE`).
* **Used By**: Feature components.
* **Dependencies**: None.

#### [frontend/src/features/Auth/AuthView.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Auth/AuthView.jsx)
* **Purpose**: Contains the split login/register dashboard UI forms.

#### [frontend/src/features/SkillTest/TestView.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/SkillTest/TestView.jsx)
* **Purpose**: Renders the lockout-remedial test verification screen and contains static question datasets.

#### [frontend/src/features/Student/StudentLayout.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/StudentLayout.jsx)
* **Purpose**: Student navigation chrome/sidebar and coordinates Student page tabs.
* **Sub-components**:
  - `components/StudentDashboard.jsx`: Oppurtunities portal matching grid.
  - `components/StudentProfile.jsx`: Profile editing general/socials/academics/experience forms.
  - `components/StudentResume.jsx`: Resume uploader and dynamically compiled PDF resume generator.
  - `components/StudentSkillTests.jsx`: Your Tests dashboard and interactive verification MCQ card.
  - `components/StudentShowcase.jsx`: Showcase Yourself page to upload or record a 1-minute 720p introduction video.

#### [frontend/src/features/Recruiter/RecruiterLayout.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Recruiter/RecruiterLayout.jsx)
* **Purpose**: Recruiter navigation sidebar and coordinates Recruiter hub views.
* **Sub-components**:
  - `components/RecruiterJobs.jsx`: Active opportunities listings and applicant reviews.
  - `components/RecruiterCandidates.jsx`: Exploring database profiles and stack filters.
  - `components/RecruiterPostJob.jsx`: Form builder for job posting and required thresholds.
  - `components/RecruiterCompany.jsx`: Trust verification status check and document upload.

#### [frontend/tailwind.config.js](file:///Users/karanrawat/Desktop/a_g/frontend/tailwind.config.js)
* **Purpose**: Declares color tokens and typography parameters matching the design system.
* **Used By**: PostCSS / Tailwind compiling.
* **Dependencies**: None.
* **Safe Modifications**: Adjusting color hex values, changing fallback font stacks.
* **Risk**: Medium.

#### [frontend/src/index.css](file:///Users/karanrawat/Desktop/a_g/frontend/src/index.css)
* **Purpose**: Loads Tailwind directives and contains custom styles (glassmorphism rules, scrollbars).
* **Used By**: `frontend/src/main.jsx`.
* **Dependencies**: None.
* **Safe Modifications**: Style class extensions, layout parameters.
### Admin Portal Files

#### [admin_ws/frontend/src/App.jsx](file:///Users/karanrawat/Desktop/a_g/admin_ws/frontend/src/App.jsx)
* **Purpose**: Coordinates all Admin Portal workspace views (Dashboard, Students directory search, Recruiters list, Active Jobs) and hosts inspectors.
* **Dependencies**: `react`, `lucide-react`.

#### [admin_ws/backend/app.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/app.js)
* **Purpose**: Express app setup for admin backend mounting `/api/dashboard`, `/api/student`, `/api/recruiter`, `/api/job`, `/api/storage`, and `/api/analytics`.
* **Used By**: `admin_ws/backend/server.js`.

#### [admin_ws/backend/src/controllers/student.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/student.controller.js)
* **Purpose**: Fetches all student records with fully resolved profiles and sub-models.

#### [admin_ws/backend/src/controllers/recruiter.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/recruiter.controller.js)
* **Purpose**: Fetches recruiter users linked with company profile settings and posted job numbers.

#### [admin_ws/backend/src/controllers/job.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/job.controller.js)
* **Purpose**: Fetches job specifications and queries candidates who applied to specific roles.

#### [admin_ws/backend/src/controllers/storage.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/storage.controller.js)
* **Purpose**: Queries S3 assets using AWS S3 client and reads MongoDB storage stats via native commands to compute estimated monthly bills.

#### [admin_ws/backend/src/controllers/analytics.controller.js](file:///Users/karanrawat/Desktop/a_g/admin_ws/backend/src/controllers/analytics.controller.js)
* **Purpose**: Computes recruiter skills demands and student profiles skill metrics to serve comparison statistics for horizontal bar charts.

---

## 4. Dependency Map

### Frontend Dependency Chain
```
index.html
  └── src/main.jsx
        ├── src/index.css (Loads Tailwind & custom scrollbars)
        └── src/App.jsx (Top-level router & state keeper)
              ├── src/constants/index.js (Static parameters)
              ├── src/features/Auth/AuthView.jsx (Signup/Login)
              ├── src/features/SkillTest/TestView.jsx (Remedial quiz)
              ├── src/features/Student/StudentLayout.jsx (Student Portal)
              │     └── components/ (Dashboard, Profile, Resume, SkillTests)
              └── src/features/Recruiter/RecruiterLayout.jsx (Recruiter Portal)
                    └── components/ (Jobs, Candidates, PostJob, Company)
```

### Backend Dependency Chain
```
src/index.js
  └── src/routes/api.js
        ├── src/middleware/auth.js (JWT validation)
        └── src/controllers/
              ├── auth.controller.js
              ├── student.controller.js
              ├── recruiter.controller.js
              │     └── src/config/db.js (Prisma / Mock fallback client)
              │           └── prisma/schema.prisma (Database Models)
              └── upload.controller.js
                    └── src/config/s3.js (AWS S3 storage helpers)
```

---

## 5. API Map

### Public Auth Endpoints
* **`POST /api/auth/signup`**
  - **Purpose**: Creates Student Profile or Recruiter Company structure.
  - **Files**: `auth.controller.js`, `api.js`
* **`POST /api/auth/login`**
  - **Purpose**: Validates email/password credentials and issues token.
  - **Files**: `auth.controller.js`, `api.js`

### Student Endpoints (Bearer JWT Required)
* **`GET /api/student/profile`**
  - **Purpose**: Fetches candidate's self-rating skills list.
  - **Files**: `student.controller.js`, `api.js`
* **`PUT /api/student/profile`**
  - **Purpose**: Updates candidate name, resume link, and skill parameters.
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

---

## 9. Search Index (Task-to-File Routing)

* **Task: Change UI Theme, Color Tokens, or Neumorphic Depth**
  - Files: `frontend/src/index.css` (all `--c-*` tokens + `--neu-*`/`--shadow-*` depth vars, light in `:root`, dark in `.dark`; `.glass-*`/`.neu-*`/`.led`/`.neu-screws` utilities live here too), `frontend/src/components/ui/*` (shared primitives — restyle here to change the look app-wide), `frontend/tailwind.config.js` (font families only), `frontend/index.html` (Google Fonts link)
  - Note: components must use semantic token classes (`bg-primary`, `text-on-surface`, etc.) and shadow utilities (`shadow-[var(--shadow-card)]`) — never hardcoded hex/zinc utilities. Design is Industrial Skeuomorphism; safety-orange (`--c-primary`) is the accent, tertiary amber is reserved for certification/upgrade CTAs, secondary is charcoal. To restyle depth globally, edit the `--shadow-*` vars once. Note: `hover:`/`focus:` variants only work on Tailwind utilities — use `hover:shadow-[var(--shadow-floating)]`, not `hover:neu-floating` (the `.neu-*` classes are plain CSS, valid only when applied statically).
* **Task: Add New Test Question / Modify Quiz Scoring**
  - Files: `frontend/src/features/SkillTest/TestView.jsx` or `frontend/src/features/Student/components/StudentSkillTests.jsx`
* **Task: Alter Job Matching Algorithm Logic**
  - Files: `backend/src/controllers/student.controller.js` (specifically `getJobs` and `applyJob` matching checks)
* **Task: Expose a New API Path**
  - Files: `backend/src/routes/api.js`, controllers in `backend/src/controllers/`
* **Task: Modify DB Schema**
  - Files: `backend/prisma/schema.prisma`
* **Task: Adjust Mock / Seeding Records**
  - Files: `backend/src/config/db.js` (specifically `mockDb` definitions)

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
  - Files are validated by checking their actual binary signature (magic bytes) at the head of the buffer: PDF (`25504446`), PNG (`89504E47`), JPEG (`FFD8FF`), MP4 (`66747970`), WebM (`1A45DFA3`). Files with spoofed extensions or corrupted contents are rejected with HTTP 400.
* **Isolation & Non-Executability**:
  - All files are saved inside isolated S3 buckets under secure folder patterns (`resumes/`, `images/`, `videos/`, `docs/`) using unique user-linked timestamps. AWS S3 does not compile or execute stored files as application code.
* **Admin Portal uploads status**:
  - The Admin Portal backend (`admin_ws/backend/`) does not contain any file upload routes. If added, they must implement matching server-mediated validation checks.
