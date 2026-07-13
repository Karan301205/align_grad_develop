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
├── my_resume.pdf                 # Asset: Sample PDF resume for student upload testing
├── package.json                  # Root workspace runner coordinating dev and installations
│
├── backend/                      # --- Main Express.js API Workspace (Port 5001) ---
│   ├── prisma/
│   │   └── schema.prisma         # Prisma schema and MongoDB collection structure definitions
│   ├── src/
│   │   ├── config/               # System configurations and DB connections
│   │   │   ├── db.js             # DB wrapper initializing Prisma Client or hot-swapping Mock
│   │   │   ├── env.js            # Environment validator enforcing fail-fast in production
│   │   │   ├── rateLimit.config.js # Centralized configuration parameters for rate limit layers
│   │   │   ├── s3.js             # AWS S3 client builder and upload buffer helper methods
│   │   │   ├── upload.config.js  # File size thresholds and allowed upload MIME type sets
│   │   │   └── mock/             # Sandbox mock client & fixture sets
│   │   │       ├── mockClient.js # In-memory emulation of Prisma API for offline execution
│   │   │       └── seed.js       # Initial mock data and database state for the mock store
│   │   ├── constants/
│   │   │   └── technicalSkills.js # Centralized list of recognized profile and job skills
│   │   ├── controllers/          # HTTP request controllers (Routing handlers only)
│   │   │   ├── auth.controller.js # Signups, logins, and token issuance
│   │   │   ├── recruiter.controller.js # Verification, candidate search, job postings
│   │   │   ├── student.controller.js # Profile updates, job listings, quiz scoring
│   │   │   └── upload.controller.js # Presigned S3 url generator and binary magic-bytes checking
│   │   ├── middleware/           # HTTP Interceptors and guards
│   │   │   ├── auth.js           # Decodes and validates JWT bearer token signatures
│   │   │   ├── errorHandler.js   # Catches errors, formatting 500s with masked prod warnings
│   │   │   ├── rateLimiter.js    # Express rate limit wrapper enforcing brute-force lockouts
│   │   │   └── validate.js       # Zod validator middleware processing incoming payloads
│   │   ├── routes/
│   │   │   └── api.js            # Express API endpoint definitions & middleware chains
│   │   ├── services/             # Core business and external integration logic
│   │   │   ├── fileCleanup.service.js # Removes outdated files/media from AWS S3 storage
│   │   │   ├── jobLifecycle.service.js # Checks and deactivates expired job postings
│   │   │   ├── skillMatching.service.js # Computes requirements overlap between students and jobs
│   │   │   └── mcq/              # LLM-powered multiple choice question generator
│   │   │       ├── mcqService.js # Main orchestrator coordinating provider sequences
│   │   │       ├── prompts.js    # AI prompt string templates formatting questions JSON
│   │   │       └── providers/
│   │   │           ├── bedrockProvider.js # AWS Bedrock Claude/Llama integration
│   │   │           └── groqProvider.js # Groq LLM API provider integration
│   │   ├── utils/
│   │   │   └── fileSignature.js  # Magic-bytes utility validating binary signatures of files
│   │   ├── validators/           # Zod schema definitions validating input payloads
│   │   │   ├── auth.validator.js
│   │   │   ├── recruiter.validator.js
│   │   │   ├── student.validator.js
│   │   │   └── upload.validator.js
│   │   └── index.js              # Application entrypoint setting up middleware, DB, and ports
│   ├── package.json
│   ├── package-lock.json
│   └── nodemon.json
│
├── frontend/                     # --- Main React + Vite Client Workspace (Port 5173) ---
│   ├── public/                   # Static browser-accessible assets (logos, icons, illustrations)
│   │   ├── a_g_lg_dark.webp
│   │   ├── a_g_logo.webp
│   │   ├── a_g_logo_dark.webp
│   │   ├── a_g_l_w.webp
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   └── login_visual.png
│   ├── src/
│   │   ├── App.css               # Shared layout resets and global container settings
│   │   ├── App.jsx               # Navigation router coordinating student, recruiter, and auth states
│   │   ├── index.css             # Main styling entry: Tailwind v4 config & neumorphic classes
│   │   ├── main.jsx              # Client mounting layer rendering the React DOM tree
│   │   ├── assets/               # Styled components SVG assets
│   │   ├── components/           # Cross-cutting UI layouts and overlays
│   │   │   ├── ConnectionLoader.jsx # Floating warning indicator showing offline API status
│   │   │   ├── JobDetailsModal.jsx # Detail job specs drawer showing matching stats & Apply hooks
│   │   │   └── ui/               # Reusable Neumorphic atomic elements
│   │   │       ├── AnimatedContent.jsx # Framer Motion container for slick transition animations
│   │   │       ├── Badge.jsx     # Skeuomorphic tag displaying skills or status indicators
│   │   │       ├── Button.jsx    # Custom chassis button supporting raised, pressed & LED states
│   │   │       ├── Card.jsx      # Neumorphic chassis card for grouping content surfaces
│   │   │       ├── ClickSpark.jsx # Canvas wrapper drawing particle sparks on click triggers
│   │   │       ├── DotGrid.css   # Layout settings for the dashboard dot matrix background
│   │   │       ├── DotGrid.jsx   # Dot matrix canvas overlay giving a workshop style look
│   │   │       ├── EmptyState.jsx # Styled recess panel rendering empty list reminders
│   │   │       ├── Input.jsx     # Recessed input field with neumorphic shadow configurations
│   │   │       ├── PageHeader.jsx # Page breadcrumbs, titles, and subtitle labels
│   │   │       ├── Select.jsx    # Neumorphic selection menu dropdown container
│   │   │       ├── SidebarNavItem.jsx # Icon + text items indicating active layout navigation
│   │   │       ├── StatCard.jsx  # Digital counter panels for tracking core metrics and KPIs
│   │   │       ├── TextArea.jsx  # Recessed multiline comment box for larger input texts
│   │   │       └── ThemeToggle.jsx # Slide toggle changing index.css from light to dark mode
│   │   ├── config/
│   │   │   └── index.js          # Client runtime variables (API_BASE endpoint url)
│   │   ├── constants/            # Client lookup options and barrel interfaces
│   │   │   ├── index.js          # Backward compatible barrel exporting constant subsets
│   │   │   ├── domains.js        # Option list of candidate specialization focus areas
│   │   │   ├── skills.js         # Complete set of skills recognized by the frontend
│   │   │   └── testQuestions.js  # Static fallback questions for offline skill certifications
│   │   ├── features/             # Business modules organizing specific portal workspaces
│   │   │   ├── Auth/
│   │   │   │   ├── AuthView.jsx  # Marketing landing page with login picker
│   │   │   │   ├── CandidateAuth.jsx # Dedicated login/signup pages for students
│   │   │   │   └── RecruiterAuth.jsx # Dedicated login/signup pages for recruiters
│   │   │   ├── SkillTest/
│   │   │   │   └── TestView.jsx  # Lockdown fullscreen exam panel executing student skill checks
│   │   │   ├── Recruiter/
│   │   │   │   ├── RecruiterLayout.jsx # Recruiter portal navigation, dashboard layouts, and tabs
│   │   │   │   └── components/
│   │   │   │       ├── EditJobModal.jsx # Recruiter drawer to update postings and requirements
│   │   │   │       ├── RecruiterCandidates.jsx # Search directory exploring profiles with filters
│   │   │   │       ├── RecruiterCompany.jsx # Company details and document uploading check
│   │   │   │       ├── RecruiterJobs.jsx # Posted positions list with matching applicant cards
│   │   │   │       └── RecruiterPostJob.jsx # Multi-step form setup to post new jobs
│   │   │   └── Student/
│   │   │       ├── StudentLayout.jsx # Student portal navigation, layout drawers, and view routes
│   │   │       └── components/
│   │   │           ├── StudentDashboard.jsx # Match opportunities matching candidate profile skills
│   │   │           ├── StudentProfile.jsx # Complex profiles layout (experience, projects, info)
│   │   │           ├── StudentProgress.jsx # Tracker displaying selection rounds progress stats
│   │   │           ├── StudentResume.jsx # Resume builder compiling details and exporting PDF
│   │   │           ├── StudentShowcase.jsx # Video introduction recorder and uploader
│   │   │           └── StudentSkillTests.jsx # Interactive dashboard to verify and upgrade skills
│   │   ├── services/             # Client-side utility abstractions
│   │   │   ├── apiClient.js      # Unified wrapper managing fetches, endpoints, and headers
│   │   │   ├── resumePdf.js      # Generates a PDF resume from student profile DOM structures
│   │   │   └── uploadService.js  # Puts raw documents/media directly to AWS S3 buckets
│   │   └── utils/
│   │       └── profileCompleteness.js # Calculates profile percentages & identifies missing fields
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── eslint.config.js
│   └── vite.config.js
│
└── admin_ws/                     # --- Isolated Admin Portal Workspace (Independent Project) ---
    ├── docker-compose.yml        # Docker environment builder running mock local databases
    ├── package.json              # Workspace script coordinator
    ├── README.md                 # Administrative setup and deployment guide
    │
    ├── backend/                  # --- Administrative Backend Express Server (Port 5002) ---
    │   ├── server.js             # Starts server and registers system event log listeners
    │   ├── app.js                # Mounts core middlewares, validation, and admin route sets
    │   ├── src/
    │   │   ├── config/
    │   │   │   ├── database.js   # Native MongoDB client connection containing getDbSafe() helper
    │   │   │   ├── env.js        # Admin environment validator for production safety checks
    │   │   │   ├── rateLimit.config.js # Custom configuration limits for admin traffic
    │   │   │   └── s3.js         # AWS S3 client builder for admin storage verification
    │   │   ├── controllers/      # HTTP request controllers (Direct MongoDB Queries)
    │   │   │   ├── analytics.controller.js # Analyzes skill metrics (job demands vs student profiles)
    │   │   │   ├── dashboard.controller.js # Aggregates summary cards and recent activity stats
    │   │   │   ├── job.controller.js # Fetches positions data and associated candidate applications
    │   │   │   ├── recruiter.controller.js # Queries company profiles and updates trust statuses
    │   │   │   ├── storage.controller.js # Coordinates storage logs across S3 and MongoDB
    │   │   │   └── student.controller.js # Returns complete student accounts and verification stats
    │   │   ├── middleware/
    │   │   │   ├── errorHandler.js # Formats server errors to prevent administrative leaks
    │   │   │   ├── rateLimiter.js # Enforces query limit blocks on admin endpoints
    │   │   │   └── validate.js   # Admin validation adapter evaluating payload schemas
    │   │   ├── mocks/
    │   │   │   └── storage.mock.js # Mock fallbacks for MongoDB and S3 storage bills
    │   │   ├── routes/           # Routes linking endpoints to admin controllers
    │   │   │   ├── analytics.routes.js
    │   │   │   ├── dashboard.routes.js
    │   │   │   ├── job.routes.js
    │   │   │   ├── recruiter.routes.js
    │   │   │   ├── storage.routes.js
    │   │   │   └── student.routes.js
    │   │   ├── services/         # Administrative helper and analytics engines
    │   │   │   ├── mongoStorage.service.js # Checks DB statistics and estimates MongoDB Atlas bills
    │   │   │   └── s3Storage.service.js # Queries bucket sizes and calculates AWS usage bills
    │   │   ├── utils/
    │   │   │   └── formatBytes.js # Bytes-to-human-readable size formatting helper
    │   │   └── validators/
    │   │       └── job.validator.js # Zod schemas verifying job parameters (checks MongoDB ObjectId)
    │   ├── package.json
    │   └── package-lock.json
    │
    └── frontend/                 # --- Administrative React Client Dashboard (Port 5174) ---
        ├── index.html            # Admin entry HTML template
        ├── postcss.config.js     # PostCSS setup compiling Tailwind configurations
        ├── tailwind.config.js    # Custom styling overrides for admin portal layouts
        ├── vite.config.js        # Vite config running client server on port 5174
        ├── src/
        │   ├── App.jsx           # Monolithic coordinator rendering overview tables & modal detail overlays
        │   ├── index.css         # Styles defining dashboard layout appearances
        │   ├── main.jsx          # Admin React DOM mounting layer
        │   └── api/
        │       └── adminApi.js   # Centralized API fetch wrapper for administrative endpoints
        ├── package.json
        └── package-lock.json
```

---

## 3. File Responsibilities

### Backend Files (`backend/`)

#### [backend/prisma/schema.prisma](file:///Users/karanrawat/Desktop/a_g/backend/prisma/schema.prisma)
* **Purpose**: Prisma ORM schema definitions for MongoDB structures. Sets up data collections (User, Profile, Company, Job, Application, TestAttempt) and their relationships.
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
* **Purpose**: DB interface module. Initializes PrismaClient, runs connection checks to MongoDB, and automatically hot-swaps to the local sandbox database client if database configurations are unavailable or invalid.
* **Used By**: All backend controllers.
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

#### [backend/src/constants/technicalSkills.js](file:///Users/karanrawat/Desktop/a_g/backend/src/constants/technicalSkills.js)
* **Purpose**: Provides a unified list of verified technical skills recognized by the alignment matching engine.
* **Used By**: [backend/src/services/skillMatching.service.js](file:///Users/karanrawat/Desktop/a_g/backend/src/services/skillMatching.service.js).
* **Dependencies**: None.
* **Safe Modifications**: Adding/removing technical skill strings.
* **Risk**: Low.

#### [backend/src/controllers/auth.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/auth.controller.js)
* **Purpose**: Express controllers managing user registrations, password hashing checks, credential validations, and signing new JWT session tokens.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: [backend/src/config/db.js](file:///Users/karanrawat/Desktop/a_g/backend/src/config/db.js), `bcryptjs`, `jsonwebtoken`.
* **Safe Modifications**: Customizing login session lifetimes, tweaking error message labels.
* **Risk**: High (handles login credentials).

#### [backend/src/controllers/recruiter.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/recruiter.controller.js)
* **Purpose**: Express controllers managing recruiter profiles, company verification requests, posting new opportunities, listing active jobs, and candidate directory reviews.
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
* **Purpose**: Analyzes student skill scores against job requirements to flag eligibility and compute missing requirements.
* **Used By**: [backend/src/controllers/student.controller.js](file:///Users/karanrawat/Desktop/a_g/backend/src/controllers/student.controller.js).
* **Dependencies**: [backend/src/constants/technicalSkills.js](file:///Users/karanrawat/Desktop/a_g/backend/src/constants/technicalSkills.js).
* **Safe Modifications**: Modifying eligibility logic (e.g. adding relaxed match rules for certifications).
* **Risk**: High (determines candidate job matching).

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
* **Purpose**: Zod validation schemas for job postings and verification requests.
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: Appending new fields to job forms, modifying minimum active days.
* **Risk**: Low.

#### [backend/src/validators/student.validator.js](file:///Users/karanrawat/Desktop/a_g/backend/src/validators/student.validator.js)
* **Purpose**: Zod validation schemas enforcing constraints on profile elements (experience arrays, education items, social URLs).
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: Customizing fields, setting rules for projects or portfolio links.
* **Risk**: Low.

#### [backend/src/validators/upload.validator.js](file:///Users/karanrawat/Desktop/a_g/backend/src/validators/upload.validator.js)
* **Purpose**: Zod schemas verifying file upload parameters (filename string, type categorization).
* **Used By**: [backend/src/routes/api.js](file:///Users/karanrawat/Desktop/a_g/backend/src/routes/api.js).
* **Dependencies**: `zod`.
* **Safe Modifications**: Customizing error messages.
* **Risk**: Low.

---

### Frontend Files (`frontend/`)

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

#### [frontend/src/index.css](file:///Users/karanrawat/Desktop/a_g/frontend/src/index.css)
* **Purpose**: Loads Tailwind directives and registers the Industrial Skeuomorphism custom design system rules (light + dark mode, variables, shadow maps, LED badges, embossed text utilities).
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
* **Purpose**: Converts student profile HTML layout elements into a clean downloadable PDF format.
* **Used By**: [frontend/src/features/Student/components/StudentResume.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/components/StudentResume.jsx).
* **Dependencies**: `html2canvas`, `jspdf`.
* **Safe Modifications**: Adjusting margins, changing scale layout settings.
* **Risk**: Low.

#### [frontend/src/services/uploadService.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/services/uploadService.js)
* **Purpose**: Uploads file buffers directly to AWS S3 using presigned URLs.
* **Used By**: [frontend/src/features/Student/components/StudentProfile.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Student/components/StudentProfile.jsx), [frontend/src/features/Recruiter/components/RecruiterCompany.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/features/Recruiter/components/RecruiterCompany.jsx).
* **Dependencies**: None (uses raw `fetch`).
* **Safe Modifications**: Editing request timeout frames.
* **Risk**: Medium.

#### [frontend/src/utils/profileCompleteness.js](file:///Users/karanrawat/Desktop/a_g/frontend/src/utils/profileCompleteness.js)
* **Purpose**: Helper logic validating candidate profile items to compute completeness percentage and list missing fields.
* **Used By**: Student dashboard and profile layouts.
* **Dependencies**: None.
* **Safe Modifications**: Altering weight scales for completeness parameters.
* **Risk**: Low.

#### [frontend/src/components/ConnectionLoader.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/components/ConnectionLoader.jsx)
* **Purpose**: A floating banner component that pings the backend `/health` check in the background. Renders a warning notification if the backend becomes unreachable.
* **Used By**: [frontend/src/App.jsx](file:///Users/karanrawat/Desktop/a_g/frontend/src/App.jsx).
* **Dependencies**: `react`, `lucide-react`.
* **Safe Modifications**: Customizing styling parameters, adjusting check intervals.
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
* **`Auth/AuthView.jsx`**: Marketing landing page with popup picker and demo widgets.
* **`Auth/CandidateAuth.jsx`**: Dedicated Candidate login and signup pages matching the skeuomorphic theme.
* **`Auth/RecruiterAuth.jsx`**: Dedicated Recruiter login and signup pages matching the skeuomorphic theme.
* **`SkillTest/TestView.jsx`**: Lockdown fullscreen exam panel checking focus state changes and scoring MCQ answers.
* **`Recruiter/RecruiterLayout.jsx`**: Sidebar navigation shell managing Recruiter views.
* **`Recruiter/components/EditJobModal.jsx`**: Recruiter modal to update job parameters and required thresholds.
* **`Recruiter/components/RecruiterJobs.jsx`**: Active jobs directory with applicant review drawers.
* **`Recruiter/components/RecruiterCandidates.jsx`**: Candidate lookup directories.
* **`Recruiter/components/RecruiterPostJob.jsx`**: Forms to create new job opportunities with required thresholds.
* **`Recruiter/components/RecruiterCompany.jsx`**: Verification status panel with document upload slots.
* **`Student/StudentLayout.jsx`**: Sidebar navigation shell managing Student views.
* **`Student/components/StudentDashboard.jsx`**: Job matching portals list showing requirements status checks.
* **`Student/components/StudentProfile.jsx`**: Candidate profiles editor panel (experience list, projects, skills).
* **`Student/components/StudentProgress.jsx`**: Tracker panel displaying candidate application rounds.
* **`Student/components/StudentResume.jsx`**: Resume builder generating downloadable PDF resume layouts.
* **`Student/components/StudentShowcase.jsx`**: Dashboard to record/upload introduction videos.
* **`Student/components/StudentSkillTests.jsx`**: Certification lists and launcher panel for AI-generated MCQ tests.

---

### Admin Portal Files (`admin_ws/`)

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
* **Task: Expose a New API Path**
  - Files: `backend/src/routes/api.js`, controllers in `backend/src/controllers/`
* **Task: Modify DB Schema**
  - Files: `backend/prisma/schema.prisma`
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
