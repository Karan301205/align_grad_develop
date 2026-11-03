# AlignGrad — Issues & Bugs Audit

**Audit date:** 2026-10-30 · **Branch:** `main` (including uncommitted working-tree changes) · **Scope:** `main_website/backend`, `main_website/frontend`, `admin_ws/`, repo hygiene and docs.

**Method:** static code review only, done in parallel by area. Nothing was run against a database (`.env` points at production Atlas). The two most severe claims in each area were re-checked by hand. Items marked **(confirm)** depend on runtime or deployment behaviour that a code read can't settle.

**Severity**
- **Critical** — exploitable now, or causes data loss or corruption.
- **High** — security or integrity hole, or a crash in a main flow.
- **Medium** — wrong behaviour or a rule broken.
- **Low** — edge case, dead code or maintainability.

Paths are repo-relative. `BE` = `main_website/backend`, `FE` = `main_website/frontend`, `ADM` = `admin_ws`.

---

## Fix-first list (top 15)

| # | ID | Issue |
|---|----|-------|
| 1 | R1 | CloudFront private key is in pushed git history, and the leaked key is still the live key. Rotate it. |
| 2 | R2 | Admin portal login is a hardcoded plaintext email/password that is in git history. |
| 3 | A1 | Google sign-in accepts tokens issued to any app. This allows account takeover. |
| 4 | A5 | `/api/courses/admin/*` on the main backend has no authentication at all. |
| 5 | U1 | `PUT /upload/secure-put` lets any user overwrite any S3 object. |
| 6 | P1 | A payment verification can be replayed for unlimited recruiter quota, and one user's payment can upgrade another user. |
| 7 | A2–A4, A6 | There are no role guards: a student can read all candidate PII, change any application's hiring status, and mass-assign their company record. |
| 8 | S1, G1 | The screening-MCQ `correctAnswer` is sent to candidates and to the public. |
| 9 | I1 | Production silently and permanently falls back to the in-memory mock DB after one connection blip, and `/health` still says ACTIVE. |
| 10 | S3–S6 | Skill-rating integrity is broken: self-rating path, alias bypass, rating raised on a failed test, and the session burn is not atomic. |
| 11 | U2 | The old-file cleanup deletes any S3 key a user points it at. |
| 12 | CM1–CM3 | Private communities are readable and joinable by anyone, and password hashes are sent to members. |
| 13 | F1 | `JobDetailsModal` crashes the whole app because `useEffect` is not imported (uncommitted change). |
| 14 | F2, F3 | Stored XSS reaches recruiter sessions through the candidate name (resume PDF tab) and `resumeUrl`. |
| 15 | R10 | `scripts/clearGigs.js` and `scripts/clearGigData.js` wipe production with no guard. |

**Counts:** 149 entries: 13 Critical, 34 High, 68 Medium, 34 Low. AD1 is a cross-reference to R2 and is not counted twice. Many entries group several closely related defects.

---

## 1. Repository, secrets & operations

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| R1 | Critical | `cloudfront_private_key.pem` (root), commit `ed93c98` | The CloudFront signing private key was committed and pushed (`origin/main`, `origin/develop`). It is gitignored now, but it is still in history, and the file on disk is byte-identical to the committed one, so the leaked key is live. **Rotate the key pair in AWS** and purge it from history. |
| R2 | Critical | `ADM/backend/src/modules/auth/auth.controller.js:5-6,20` (copy at `ADM/backend/src/controllers/auth.controller.js:5-6`); commits `ddefffa`, `ee7f015` | The admin login is one hardcoded email/password in plaintext, compared with `===`. It is in git history: change the password and move to hashed, DB-stored admin accounts. |
| R3 | High | `BE/src/modules/courses/course.service.js:11-13` | The CloudFront domain, key-pair ID and private-key path have hardcoded fallbacks in source. |
| R4 | Medium | `FE/public/Karan Rawat_Generated_Resume.pdf` | A personal resume is tracked in `public/` and served publicly on every deploy. |
| R5 | Medium | `FE/.env` (`VITE_API_BASE_URL=localhost`), `FE/src/config/index.js:13-24` | The local `dist/` build has `localhost:5001` baked in. There is no prod guard: if the variable is unset, `API_BASE=''` and calls hit the frontend origin. **(confirm deploy pipeline)** |
| R6 | Medium | `BE/.env` (`NODE_ENV=production`), `BE/src/config/env.js:7-12`, `BE/package.json` | Because the local `.env` sets production mode, `npm run dev:mock` and `bank:loadtest` throw "missing DATABASE_URL", and plain `npm run dev` runs in prod mode against Atlas. |
| R7 | Low | `BE/.env.example`, `FE/.env.example` | The examples have drifted. Backend is missing `NODE_ENV`, `GOOGLE_CLIENT_*` and `CLOUDFRONT_*`, and lists unused `SUPABASE_*`. Frontend is missing `VITE_LANDING_URL`, `VITE_CANDIDATE_URL`, `VITE_RECRUITER_URL` and `VITE_*_LANDING_PATH`, and lists Supabase. |
| R8 | Low | `BE/scripts/output/questionBank.backup.json` | A byte-identical 5 MB duplicate of `questionBank.json` is tracked. |
| R9 | Medium | `BE/tests/questionBank/{assessmentRepository,questionRepository,maintenance}.test.js:3`, `BE/tests/skills/projectRelevance.test.js:9` | These tests don't stub `config/db`, so `npm test` connects to production Atlas (read-only probe). There is no CI (`.github/` is absent). |
| R10 | High | `BE/scripts/clearGigs.js:1-41`, `BE/scripts/clearGigData.js:5-71` | These scripts have no dry-run, confirmation or `isMock()` guard. They load the prod `.env` and `deleteMany({})` every gig collection; `clearGigData` also deletes S3 objects. |
| R11 | Low | `BE/package.json` | Unused dependencies: `pdf-parse`, `mammoth`, `@anthropic-ai/sdk`, `@aws-sdk/client-sns`. |
| R12 | Low | `.gitignore:49-62` | `CLAUDE.md`, `MEMORY.md`, `README.md` and `docs/` are gitignored, so the project's architecture docs aren't shared with teammates or clones. |

## 2. Backend — authentication & access control

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| A1 | Critical | `BE/src/modules/auth/auth.controller.js:169-185` | Google sign-in checks the token with `tokeninfo` but never checks `aud` against `GOOGLE_CLIENT_ID` or `email_verified`. A Google token obtained by any third-party site logs in as that user. `credential` is also not URL-encoded. |
| A2 | Critical | `BE/src/middleware/auth.js:27`; `BE/src/modules/students/student.routes.js:17-31`; `BE/src/modules/recruiters/recruiter.routes.js:18-29` | No role-check middleware exists, and controllers never check `req.user.role`. Students can call every recruiter endpoint and recruiters can call student endpoints; for example, `PUT /student/profile` creates a candidate profile for a recruiter. **✅ Partly fixed 2026-11-02: `requireApprovedRecruiter` guards job/gig posting, candidates, top-talents and application rounds; other routes still lack role checks.** |
| A3 | Critical | `BE/src/modules/recruiters/recruiter.controller.js:372-375` | `GET /recruiter/candidates` returns every profile (phone, DOB, email, resume and video URLs) to any logged-in user, with no paging. **✅ Partly fixed 2026-11-02: now limited to approved recruiters (still unpaginated, full PII).** |
| A4 | Critical | `BE/src/modules/recruiters/recruiter.controller.js:510-546` | `updateApplicationRounds` has no ownership check. A student can mark themselves `SELECTED`, and a rival recruiter can reject another company's candidates. |
| A5 | Critical | `BE/src/modules/courses/course.routes.js:20-34` (+ `course.service.js:94-110`, `:558-565`) | All `/courses/admin/*` routes have no auth. Anyone can create, update or delete courses, and can get presigned S3 PUT URLs with any folder and content type (for example, hosting `text/html` on the bucket). |
| A6 | Critical | `BE/src/modules/recruiters/recruiter.controller.js:58-61`, `recruiterCompany.validator.js:3` | `prisma.company.update({ data: req.body })` with a validator that never runs (see A7). `{"verified":true,"jobPostingQuota":9999}` or nested `user` writes succeed. **✅ Fixed 2026-11-02: validator wrapped in `{ body }` (unknown keys stripped); profile also locked while PENDING/APPROVED.** |
| A7 | High | `BE/src/middleware/validate.js:7-15` vs `community.validator.js:3-55`, `recruiterCompany.validator.js:3`, `payment.validator.js:3,11` | `validate()` only reads `schema.body`, `schema.params` and `schema.query`. Plain `z.object(...)` schemas, and `z.object({ body: ... })` wrappers (zod has no `.body` property on those), are silently skipped, so these routes have no validation at all. |
| A8 | Medium | `BE/src/modules/auth/auth.controller.js:163,200-205`; `auth.routes.js:11` | The Google sign-in `role` is not allow-listed, so `role:"ADMIN"` (or any string) is stored and signed into the JWT. |
| A9 | Medium | `auth.controller.js:108-115`; `BE/src/modules/auth/services/passwordReset.service.js:25-30,43-49,101-104` | Login returns the role mismatch before checking the password, so it reveals accounts and their roles. Password reset returns 429/500 only for real accounts. The reset-attempt counter is read-then-write, so it races. |
| A10 | Medium | `BE/src/middleware/auth.js:15-27`; `passwordReset.service.js:151-160` | There is no way to revoke a token (no token version). A password reset, role change or deleted user leaves old 24h JWTs valid. |
| A11 | Medium | `auth.controller.js:34-38,191-195` | `regNo = count+1` on a `@unique` field. Concurrent signups return 500. After any user is deleted, every later signup for that role fails permanently. |
| A12 | Medium | `BE/src/middleware/rateLimiter.js:14,48,62-71` | The rate-limit key is the exact path, so `/auth/LOGIN` and `/auth/login/` bypass it. Every distinct path grows the in-memory map. The login lock is keyed per email, so anyone can lock out a user. A non-string `email` causes a 500 before validation. |
| A13 | Medium | `BE/src/index.js:12` | `cors()` allows every origin even though `CLIENT_URL` is configured. There is no helmet or other security headers. |
| A14 | Medium | `BE/src/config/env.js:26,31`; `BE/src/middleware/errorHandler.js:17,33` | Outside `NODE_ENV=production`, the JWT secret falls back to a value hardcoded in the repo, and the error handler returns stack traces. |

## 3. Backend — students, jobs & assessments

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| S1 | Critical | `BE/src/modules/students/student.controller.js:280`, `:786-790`, `:810-819` | `getJobs`, applications and the **unauthenticated** `GET /student/jobs/:id/public` return `screeningQuestions[].correctAnswer`. |
| S2 | High | `student.controller.js:257`, `:812`; `BE/src/modules/recruiters/recruiter.controller.js:69-164` | `include: { company: true }` and `getCompanyById` expose company `verificationDocs`, `docUrl`, `officialEmail`, `userId` and `jobPostingQuota` to students and anonymous users. |
| S3 | High | `student.controller.js:54-63` (`reconcileSkills`) | Any skill without bank questions accepts a client rating from 1 to 10, and that rating is kept after questions are seeded. This breaks the "ratings are server-owned" rule. Note (2026-11-02): the job brief's "Add skill without a test" popup now relies on this on purpose. It saves a no-test skill as self-rated at the job's required level. If S3 is fixed (e.g. by forcing a re-verify once questions are seeded), keep that flow working. |
| S4 | High | `student.controller.js:48-50` vs `BE/src/modules/skills/skillMatching.service.js:19` | The lock checks the exact lowercase name, but matching resolves aliases and trims. Names like `"React "` or `"next js"` bypass the lock and are then matched as React or Next.js. |
| S5 | High | `student.controller.js:621-625` | A failed test still sets `rating = score/10` (60% gives 6), which the matcher uses, and it wipes an earlier `verifiedRating`. |
| S6 | High | `BE/src/services/questionBank/repositories/testSessionRepository.js:13-21`; `student.controller.js:556-581`, `:573`, `:652` | Checking and burning the session is not atomic, so parallel submits are all scored. Per-question `correct` results plus unlimited retakes let a candidate rebuild the answer bank. |
| S7 | Medium | `student.controller.js:469-476` vs `:519-521` | `hasQuiz` is true with 1 or more questions, but generating a test needs 10. Skills with 1–9 questions show "Quiz Available", always fail, and are never auto-verified. |
| S8 | Medium | `BE/src/modules/students/student.validator.js:158`; `FE/src/features/Student/pages/StudentLayout.jsx:407`; `BE/src/services/questionBank/scoring.js:9` | Skips can't be represented. The validator rejects `-1`, the frontend sends `0`, and scoring treats `null` as `0`. A skipped question counts as answer A, and `skipCount` is always 0. |
| S9 | Low | `BE/src/modules/students/student.routes.js:25` | `validate(submitTestSchema)` runs before the 410 handler, so legacy `POST /student/tests` returns 400, not 410. |
| S10 | Medium | `student.controller.js:334-339`, `:356-423`; `BE/prisma/schema.prisma:251-260` | `applyJob` accepts PAUSED, CLOSED or expired jobs. There is no unique `(studentId, jobId)`, so double-submits create duplicate applications. |
| S11 | Medium | `student.controller.js:184` | `username: username ? username : null`, so any profile save that omits the username erases it and then blocks applying. |
| S12 | Medium | `BE/src/modules/jobs/jobLifecycle.service.js:8-18` | Every job list request scans all jobs and **hard-deletes** expired jobs and their applications one at a time. Hiring history is lost, and latency grows with the number of jobs. |
| S13 | Low | `student.controller.js:257`, `:777-793`, `:789` | Unpaged lists, N+1 queries per application, and a hardcoded `'Aether Corp'` company fallback. |

## 4. Backend — recruiters

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| RC1 | High | `BE/src/modules/recruiters/recruiter.controller.js:171-204` | `verifyCompany` sets `verified: true` as soon as any URL is submitted. There is no review step, so the verified badge is self-granted. **✅ Fixed 2026-11-02: documents now queue the company as PENDING; only an admin approves (admin_ws `PATCH /api/recruiter/:id/verification`).** |
| RC2 | High | `recruiter.controller.js:251-262`; `recruiter.validator.js:41` | The quota excludes `opportunityType: 'GIG'`, and that field is a free string, so a recruiter can post unlimited jobs. Quota counts *existing* jobs, so delete-and-repost is free. The count-then-create check races. |
| RC3 | Medium | `recruiter.controller.js:579-589` | `status: 'CLOSED'` maps to `ACTIVE`, so closing a job re-opens it. |
| RC4 | Medium | `recruiter.controller.js:449,451` | Editing a job without resending `activeDays` or `openings` resets them to 30/null, which can trigger an immediate purge of the job and its applications. |
| RC5 | Medium | `recruiter.controller.js:15-23` | The auto-created company includes `about`, which isn't in the Company model, so the create always fails and a fake company with no `id` is returned. **✅ Fixed 2026-11-02: removed `about` from the auto-create.** |
| RC6 | Low | `recruiter.controller.js:97-105`, `:123`, `:630`; `BE/src/modules/skills/candidateRecommendation.service.js:283` | `activeJobs` equals `totalJobs`. Unrated companies default to a 5.0 rating. `?limit=abc` gives NaN and there is no cap. `app.job` is never loaded, so the familiarity boost is dead. |
| RC7 | Low | `BE/src/modules/recruiters/hiringProgress.service.js` | Unused; the frontend keeps its own copy (`FE/src/utils/hiringProgress.js`). |

## 5. Backend — uploads & storage

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| U1 | Critical | `BE/src/modules/uploads/upload.controller.js:55-87` | `securePut` takes `key`, `fileType` and `contentType` from the query and never ties `key` to `req.user.id`, so anyone can overwrite other users' resumes, logos, verification docs and course videos. |
| U2 | High | `BE/src/modules/uploads/fileCleanup.service.js:9-16` (called from `student.controller.js:674-677`, `recruiter.controller.js:50-53,183-186`) | The old-file cleanup deletes whatever key follows `.amazonaws.com/` in a URL the user stored. Set the URL to a victim's file, replace it, and the victim's file is deleted. |
| U3 | Medium | `BE/src/index.js:13` | `express.raw({limit:'60mb'})` buffers the body **before** auth on `/upload/secure-put`, which has no rate limit, so unauthenticated uploads can exhaust memory. **✅ Partly fixed 2026-11-02:** `authMiddleware` now runs before `express.raw`, so unauthenticated bodies are rejected before buffering, and the raw cap follows the largest `upload.config.js` limit (now 100MB for `projectVideo`). Still missing: a rate limit on `secure-put`. |
| U4 | Medium | `BE/src/modules/community/services/media.service.js:48`; `BE/src/infrastructure/storage/s3/index.js:24-31` | The size check is skipped when `sizeBytes` is missing, and the presigned PUT doesn't bind `ContentLength`, so multi-GB uploads are possible. |
| U5 | Low | `BE/src/shared/utils/fileSignature.js:19,47-48` | The `doc` check ends with `\|\| buffer.length > 0` (always true). `image` accepts any RIFF file, and `video` accepts any buffer containing "free" or "skip". |
| U6 | Medium | `BE/src/modules/students/student.validator.js:11-24` | The resume URL check validates only the hostname, so `javascript://drive.google.com/%0a...` passes (see F3). |
| U7 | Low | `student.controller.js:709-714` | The video upload's file extension and `contentType` are not validated. |

## 6. Backend — gigs

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| G1 | Critical | `BE/src/modules/gigs/gig.controller.js:117-119`, `:244-247`, `:316`, `:369-370` | Gig list, my-gigs and both gig-detail branches return `screeningQuestions[].correctAnswer` to candidates. |
| G2 | High | `gig.controller.js:237-247`, `:297-376` | Any applicant gets the full gig: other applicants' pitches and answers (with `isCorrect`), private owner↔hired chat, and every deliverable URL. |
| G3 | High | `gig.controller.js:116-118`, `:243-245`, `:305-307`, `:331-333` | The full Company row, including KYC `verificationDocs`, `docUrl` and `officialEmail`, is attached to gig responses for students. |
| G4 | High | `gig.controller.js:15-139`, `:384` | The candidate gigs subscription paywall is enforced only in the browser. The API serves and accepts applications for every gig. |
| G5 | Medium | `gig.controller.js:540-563`, `:880-907`, `:1021-1029` | The owner can "hire" any user ID (not just applicants), set any status (straight to COMPLETED), and review, which appends fabricated experience to any student's profile. |
| G6 | Medium | `gig.controller.js:791-794`, `:801-814`, `:858-862`, `:601-606` | Accepting work never sets COMPLETED, so reviews are unreachable through the UI. Reviews only work for `selectedCandidateId`. Rejecting a hired candidate leaves them in `hiredCandidateIds`. `completeGig` without a candidate falls back to `findFirst`. |
| G7 | Medium | `gig.controller.js:44-46`, `:116`, `:243` | Unbounded `gig.findMany` plus `company.findMany()` of the whole table, with filtering in memory, on every list call and every 4s poll. |
| G8 | Low | `gig.controller.js:403-418`, `:508`, `:640-667`, `:89-96`, `:112-114` | Duplicate applications can race in. Applications are accepted on IN_PROGRESS gigs. `receiverId` is taken from the client, there is an artificial 800 ms delay, and the shared typing flag races. Budget and rating filter semantics don't match their labels. |
| G9 | Medium | `BE/src/modules/gigs/gig.validator.js:28` | `answer` is `min(1)`, so optional screening questions can't be left blank (see ST4). |

## 7. Backend — payments

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| P1 | Critical | `BE/src/modules/payments/payment.controller.js:75-140` | `verifyPayment` never checks that the order is unpaid or belongs to `req.user`, and takes `planType` from the body. Re-POSTing one valid signature gives +5 quota every time, and user B can upgrade with user A's payment. The quota update is read-then-write rather than atomic. |
| P2 | Medium | `payment.controller.js:21-28`, `:125-138` | There is no Razorpay webhook or reconciliation, so a browser closed after capture means the user paid and was never credited. `createOrder` has no role check, so a student buying `RECRUITER_5_PACK` is marked PAID and then gets a 500. |
| P3 | Low | `payment.controller.js:85` | The HMAC is compared with `!==` rather than `crypto.timingSafeEqual`. |

## 8. Backend — courses

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| C1 | High | `BE/src/modules/courses/course.routes.js:16`; `course.service.js:462-500` | The lesson stream uses `optionalAuth` and checks no plan, enrollment or `isPublished`. Anonymous users get 4h CloudFront signed URLs for any lesson. |
| C2 | Medium | `course.service.js:60-64`, `:85-88`, `:490-491` | When signing fails, the code silently returns the unsigned URL. The 4h expiry is long. |
| C3 | Medium | `course.service.js:438-459`; `FE/src/features/Student/components/StudentCourses.jsx:203-219` | Course details send `videoKey` and quiz `correctAnswer` to anonymous users. The quiz is scored on the client and the lesson completes whatever the score. **(confirm bucket ACL: if public, `videoKey` bypasses CloudFront)** |
| C4 | Medium | `course.service.js:399-407`, `:417` | `ensureSampleCourse` runs on every boot and forces `isPublished: true`, so courses an admin unpublished are re-published. |
| C5 | Low | `course.service.js:466,477`; `BE/src/middleware/errorHandler.js:16` | "Not found" errors and Prisma P2025/P2002 surface as 500. |

## 9. Backend — community

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| CM1 | High | `BE/src/modules/community/services/feed.service.js:7-27`; `community.service.js:114-150` | The feed doesn't check membership or deletion, and `/community/search` lists PRIVATE communities with their IDs, so any user can read any private feed. |
| CM2 | High | `comment.service.js:6-37`, `:59-77`; `reaction.service.js:11`; `bookmark.service.js:6-27`; `view.service.js` | Comments, reactions, bookmarks and views don't check membership. `parentCommentId` isn't checked to belong to the same post. |
| CM3 | High | `community.service.js:90-96`, `:214-230` | The bcrypt `passwordHash` is returned to members (and passwords can be 4 characters). A private community with no password can be joined by anyone. |
| CM4 | Medium | `community.controller.js:14-15`, `:97-98`, `:167-168`; `bookmark.service.js:33-41`; `comment.service.js:64-70` | `limit` and `page` are uncapped, and `page=0` gives a negative skip and a 500. Bookmark `take` is passed as a string, which is a Prisma error. Comments are fully loaded and then sliced. |
| CM5 | Low | `invite.service.js:40-95`; `comment.service.js:125-130`, `:158` | Invites work on deleted communities, and the `maxUses` check races. Replies to deleted comments get promoted to top level. `COMMENT_DELETE_ANY` is never used. |

## 10. Backend — infrastructure, DB & mock

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| I1 | Critical | `BE/src/infrastructure/database/index.js:42-65`, `:104-111`; `BE/src/index.js:22-35` | If the startup probe takes over 5s, or any mid-request connection error occurs, the server switches **permanently** to the in-memory mock, with no production guard. Signups, applications and paid upgrades are then lost on restart, and seed data is served to real users. `/health` still says `ACTIVE` and leaks raw DB errors. **(check deploy logs for `[DATABASE CONNECT FAIL]`)** |
| I2 | High | `BE/src/infrastructure/database/mock/mockClient.js:53` & `:149` | `company:` is defined twice, so the second wins and `company.findFirst`/`findMany` are missing. `user.update` and `courseEnrollment.update` are also missing. Recruiter, gigs, password reset, payment and lesson progress crash in mock or fallback mode. **✅ Partly fixed 2026-11-02:** the duplicate `company` key is merged; `company.findFirst`/`findMany` now exist and return null/filtered rows like Prisma (the dead first copy also fell back to the first company on no match). Gig list/detail and recruiter `getCompany` now run in mock mode. `user.update` and `courseEnrollment.update` are still missing. |
| I3 | Medium | `mockClient.js:94-95`, `:109`, `:117-146`, `:196`, `:227-233`, `:888` | The mock diverges from Prisma in several ways. `profile.findUnique` attaches `user.password`, so the hash reaches the client. `findMany` ignores `where`. `job.update` drops `isPaused`, `status` and `workMode`. `profile.update` drops the preference fields. The comment sort comparator is a no-op. |
| I4 | Medium | `BE/prisma/schema.prisma:38`, `:184`, `:251-260` | Missing constraints and indexes: no `@@unique([jobId, studentId])` on Application, no index on `Job.companyId`, `Profile.username` not unique, and no TTL on TestSession. |
| I5 | Medium | `BE/src/infrastructure/email/emailTransport.js:20`, `:44-47`; `emailTemplates.js:60` | SMTP has `rejectUnauthorized: false`, so it can be intercepted (MITM). Every mail is logged as "Password reset" with the recipient's email. The user-typed `name` is unescaped in the HTML email template, which allows phishing content. |
| I6 | Medium | `BE/src/services/questionBank/**` vs `BE/src/modules/assessments/question-bank/**`; `BE/src/services/community/**`, `services/mcq/**`, `modules/assessments/mcq/**`, `infrastructure/ai/**`, `infrastructure/logging/` | There are two full copies of the question bank. The *services* copy is live for tests, submit and CLI; the *modules* copy is used only for `registryCache`. The community, mcq, ai and logging copies are not imported at all. A fix made in one copy won't reach production. |
| I7 | Low | `BE/scripts/seedQuestionBank.js:32,37-38,118-119`; `BE/src/cli/commands/normalizeSkillNames.js:19-24,145-150` | `contentKey` doesn't trim but the row does, so re-runs duplicate. The rollback misses partial batches. Normalizing can create duplicate skills in a profile, and has a lost-update race. |
| I8 | Low | `BE/src/infrastructure/database/index.js:136-143` | A method missing from both clients gives an opaque `apply of undefined` TypeError. |

## 11. Frontend — app shell, auth & shared components

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| F1 | High | `FE/src/components/JobDetailsModal.jsx:1,60`; `FE/src/main.jsx:6-10` | `useEffect` is used but not imported (introduced by the uncommitted change). There is no error boundary, so opening any job's details blanks the whole app. |
| F2 | High | `FE/src/services/resumePdf.js:45-52` | `student.name` is written unescaped into the `<title>` of a same-origin `about:blank` window, so a candidate's name runs script in the recruiter's session and can steal their JWT. |
| F3 | High | `FE/src/features/Recruiter/components/RecruiterApplications.jsx:289` | `window.open(student.resumeUrl)` on a raw URL, which React does not sanitize. Combined with U6 this gives `javascript:` execution. **(confirm browser behaviour)** |
| F4 | High | `FE/src/features/Recruiter/components/EditJobModal.jsx:8-42` | Hooks are called after `if (!job) return null`, which breaks the Rules of Hooks, so React throws when `job` toggles while the modal is mounted. |
| F5 | High | `FE/src/app/App.jsx:151,165` vs `:190-205`, `:276-278` | Early returns make the cross-subdomain redirect unreachable. The result is a wrong-portal login dead end ("students only"), and a login loop on `/candidate/signup` after authenticating. |
| F6 | Medium | `App.jsx:26-27`, `:322` | `JSON.parse(localStorage.user)` has no try/catch and runs on every render, so a corrupt value crashes boot. Any non-STUDENT role (or a missing one) renders the recruiter layout. |
| F7 | Medium | `App.jsx:127-129`; `FE/src/components/ConnectionLoader.jsx:8-39` | Every route, including the legal and landing pages, is blocked until `/health` reports the DB as ACTIVE, polling forever. |
| F8 | Medium | `App.jsx:36-47`, `:179-181`, `:262-270` | The `?auth_prompt=signup_required` toast can never render for logged-out users, so shared job links bounce to the landing page with no explanation. |
| F9 | Medium | `FE/src/services/resumePdf.js:17-22`, `:35-40` | The resume is rendered as one image on one A4 page, so longer resumes are cut off. |
| F10 | Medium | `FE/src/features/Auth/pages/AuthView.jsx:126`, `:134`, `:1242-1300`, `:1485` vs `FE/src/components/PaymentModal.jsx:26-34` | The FAQ says skill exams and applying are "100% free", but the paywall charges ₹2,500. The page also has fabricated testimonials and income figures, and "guaranteed stipends". |
| F11 | Medium | `FE/src/components/ResumePdfTemplate.jsx:12,25-26,204`; `JobDetailsModal.jsx:127,271,280,739`; `FE/src/features/Student/pages/StudentLayout.jsx:798`; `FE/src/components/CompanyProfileModal.jsx:102` | Placeholder data is shown to users: "CANDIDATE NAME", **"AlignGrade Verified Candidate"** for unverified users, "Aether Corp", a hardcoded `'Unverified (0/10)'`, `'CAN001'`, and a 5.0 rating for unrated companies. |
| F12 | Medium | `FE/src/constants/skills.js:161-162`, `:185-223` vs `BE/src/modules/skills/technicalSkills.js` | The skill lists have drifted: "Tailwind" is duplicated, `redis`/`graphql` are not selectable, and backend-only skills exist. `SKILLS_WITH_MCQ` is a hardcoded list of 36 skills while the bank covers about 143. |
| F13 | Low | `FE/src/features/skill-test/pages/TestView.jsx:9-40,62-82,125`; `FE/src/constants/testQuestions.js` | Dead legacy test flow: it scores on the client, hardcodes `testPassed = true`, ships answer keys in the bundle, and calls the 410 endpoint. Delete it. |
| F14 | Low | `FE/src/utils/recentCandidateViews.js:72-82`; `App.jsx:112-117` | Up to 20 full candidate profiles are kept in localStorage per recruiter and are not cleared on logout. |
| F15 | Low | `AuthView.jsx:188,591`; `FE/src/features/RecruiterLanding/pages/RecruiterLandingPage.jsx:93,494`; `FE/src/utils/errorFormatter.jsx:13-14,159,163`; `FE/index.html:14`; `CompanyProfileModal.jsx:9-31` | "Remember me" does nothing. Expired tokens are never checked on the client. The errorFormatter field branch can never run and its keys are wrong. Razorpay `checkout.js` loads synchronously on every page with no SRI. The company modal has a stale-response race. |
| F16 | Low | `FE/src/features/Auth/pages/{CandidateAuth,RecruiterAuth}.jsx`, `FE/src/features/Auth/*.jsx` shims, `FE/src/components/ui/{StatCard,Select,ThemeToggle}.jsx`, `FE/src/styles/App.css` | Dead or unused files. `ThemeToggle` returns null, so the theme state does nothing. |
| F17 | Low | `FE` (`npm run lint`) | 505 lint problems (486 errors): 343 unused variables, 48 `react-hooks/refs`, 34 setState-in-effect, 25 rules-of-hooks, 18 exhaustive-deps. |

## 12. Frontend — student portal

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| ST1 | High | `FE/src/features/Student/components/StudentProfile.jsx:3929-3935`; `StudentSkillTests.jsx:663` | The UI offers a 1–10 "Set self-rating" dropdown and tells users to "self-rate", which goes against the server-owned-ratings rule (pairs with S3). |
| ST2 | High | `FE/src/features/Student/components/StudentDashboard.jsx:51`, `:350-354` | The "see all jobs" paywall is client-only and applies after filtering. The API returns every job and `applyJob` never checks the plan. Note (2026-11-02): the job brief's Previous/Next applies the same client-side cap via `FE/src/utils/jobAccess.js` (`FREE_PLAN_JOB_LIMIT`); a server-side fix should mirror that limit. |
| ST3 | High | `FE/src/features/Student/pages/JobBriefPage.jsx:229-245`, `:559`, `:801` | Eligibility is recomputed on the client and ignores the server's `job.matched`/`requirementStatuses` (soft skills, skills with no quiz, aliases). Valid candidates are shown "Application Locked". |
| ST4 | High | `JobBriefPage.jsx:255-260`, `:288` vs `BE/src/modules/students/student.validator.js:133`; `FE/src/features/Gigs/pages/GigsMarketplace.jsx:1497-1503` vs `gig.validator.js:28` | Every screening question is sent with `answer: ''`, and the validator requires `min(1)`, so a blank optional question fails the whole application with 400. |
| ST5 | Medium | `StudentProfile.jsx:809-856` | `hasChanges` ignores work-mode, type and location preferences, so changing only those can't be saved. |
| ST6 | Medium | `StudentProfile.jsx:335-406`, `:472-481` | The project-video XHR isn't aborted when the modal closes, so the finished upload attaches to whichever project is open next. |
| ST7 | Medium | `FE/src/features/Student/pages/StudentLayout.jsx:190`, `:817` | Every refresh sets the global `loading` flag, which unmounts the current screen and resets filters and gig state. |
| ST8 | Medium | `FE/src/features/Student/components/StudentSkillTests.jsx:116-127`, `:439` | A generated test with zero questions renders a blank tab, and there is no cancel or exit mid-test. |
| ST9 | Medium | `StudentLayout.jsx:280-282`, `:629` | The Courses tab is shown as unlocked but bounces to Profile, with no message, when the profile is incomplete. **✅ Fixed 2026-11-02:** Courses is now `locked: !isComplete` like the other gated tabs, so it shows the lock and the "complete your profile" notice. |
| ST10 | Medium | `StudentProfile.jsx:485-516`; `FE/src/features/Student/components/StudentCourses.jsx:141-168` | Stale-response races: the username availability check, and lesson streams (lesson A's video plays under B's title). |
| ST11 | Low | `StudentLayout.jsx:493-568`, `:512`, `:30`, `:48`, `:615` | Dead or broken handlers: `executeResumeUploadAndParse` is undefined, the delete-resume handler would wipe the username, and there are unused imports and props. |
| ST12 | Low | `FE/src/features/Student/components/StudentShowcase.jsx:135`, `:146-156`, `:191-201`, `:259` | Object URLs (up to 50 MB) are never revoked. A side effect inside a setState updater means the auto-stop fires twice in StrictMode. |
| ST13 | Low | `JobBriefPage.jsx:393-395` | The PDF prints "undefined" round descriptions, and long lists overflow the page. |
| ST14 | Low | `StudentProfile.jsx` (4,315 lines, about 60 props) | Maintainability hotspot; it already causes duplicated, drifting profile-PUT payloads (`StudentLayout.jsx:358,449,536`). |

## 13. Frontend — recruiter portal

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| RF1 | Medium | `FE/src/features/Recruiter/components/RecruiterApplications.jsx:934-936`, `:949-951`; `RecruiterJobs.jsx:690`, `:711` | A shallow-copied rounds array is mutated in place, so cancelled edits still show as saved. |
| RF2 | Medium | `RecruiterApplications.jsx:979`; `RecruiterJobs.jsx:737` vs `recruiter.controller.js:523-535` | The current `status` is always sent, so the server's automatic status never applies and an accidental REJECTED sticks. |
| RF3 | Medium | `FE/src/features/Recruiter/components/RecruiterCompany.jsx:159`, `:190`; `FE/src/features/Recruiter/pages/RecruiterLayout.jsx:116` | The S3 PUT result is never checked and there is no client-side type or size check, so "uploaded successfully" appears for failed uploads. |
| RF4 | Medium | `RecruiterCompany.jsx:45-48`, `:313` | The official email must end in `@gmail.com`, so a corporate domain locks the recruiter out of the dashboard. **(confirm intended rule)** |
| RF5 | Low | `RecruiterApplications.jsx:929` | Renders `r.roundName`, but rounds use `name`, so headers are blank. |
| RF6 | Low | `FE/src/features/Recruiter/components/ScreeningQuestionBuilder.jsx:66-69` | The correct answer is tracked by option text and defaults silently to the first option typed. |
| RF7 | Low | `RecruiterLayout.jsx:76` | Downloads the full candidate list (see A3) on every refresh. |

## 14. Frontend — gigs & community

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| GF1 | High | `FE/src/features/Gigs/pages/GigsMarketplace.jsx:3434`, `:3467`, `:3480` | `sendingOtherChat`/`setSendingOtherChat` are never declared, so opening "Rest of Candidates" throws a ReferenceError and the Gigs tab crashes. |
| GF2 | High | `GigsMarketplace.jsx:1320` | `isHiredCandidate` checks only `selectedCandidateId`, so earlier hires lose the submission form after another hire. |
| GF3 | High | `GigsMarketplace.jsx:1265-1271`, `:3689`, `:3739`, `:3749` | `handleReviewAction` ignores `candidateId`, so Accept or Revision can apply to another candidate's submission. Candidates with no submission are shown `submissions[0]`. |
| GF4 | Medium | `GigsMarketplace.jsx:3284-3296` | "Switch Hire" adds a hire rather than switching. "Reject" on a hired candidate doesn't un-hire them. |
| GF5 | Medium | `FE/src/features/Gigs/components/GigDetailPage.jsx:124-126` vs `gig.controller.js:451` | The UI requires every skill at rating 1 or more, while the server only enforces `minRating > 1`, so eligible candidates are blocked. |
| GF6 | Medium | `GigsMarketplace.jsx:676-693` | The 2.5s/4s polling keeps running after leaving the view, and every poll scrolls the chat to the bottom. |
| GF7 | Medium | `GigsMarketplace.jsx:577-578`, `:1127`, `:1176` | The optimistic chat code drops any earlier message with the same text ("ok"), and blob URLs are never revoked. |
| GF8 | Low | `GigsMarketplace.jsx:1072-1086`, `:1451`, `:1460`, `:1515-1527`; `FE/src/features/Community/components/PostCard.jsx:118` | Hiring fails silently. The ₹2,500 price is hardcoded and an "escrow" is claimed that doesn't exist. A stale edit attachment can be uploaded to the wrong gig. Every author gets a verified check. |
| GF9 | Low | `FE/src/features/Community/components/CommunityFeed.jsx:17-58`; `PostComposer.jsx:70-76`; `PostCard.jsx:161-163`; `CommentSection.jsx:146` | Feed stale-response race and duplicate keys. Mixed-media posts render wrongly. Comments never page past 20. |
| GF10 | Low | `GigsMarketplace.jsx:2230,2538,3196-3200,3345-3349,3416,3564-3574,3724`; `GigDetailPage.jsx:532`; `PostCard.jsx:170` | User URLs are rendered as `href` with no http(s) allow-list. React 19 blocks `javascript:` here, so this is defense-in-depth; the server should still validate the scheme. |
| GF11 | Low | `GigsMarketplace.jsx` (3,805 lines), `:438-447`, `:67`, `:477-482` | The candidate-ID logic is copy-pasted about 8 times. The whole candidate list is fetched to find one candidate. Dead components and a `console.log` was added just to satisfy the linter. |

## 15. Admin portal (`admin_ws`)

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| AD1 | Critical | see **R2** | Hardcoded plaintext admin credentials. |
| AD2 | High | `ADM/backend/src/middleware/rateLimiter.js:11`; `ADM/backend/app.js:38` | The rate-limit key is `path:ip` at 1000 per 15 min with no login lockout, so case and trailing-slash path variants give unlimited password guessing. Unbounded map growth. |
| AD3 | High | `ADM/backend/src/modules/courses/course.controller.js:171-175`, `:371` | `updateCourse` writes `$set: req.body` and `updateLesson` spreads `req.body`. A wrong type (`title: null`) breaks the main app's Prisma reads, which takes down the course catalog. Changing a lesson `id` orphans progress records. |
| AD4 | High | `course.controller.js:325-338` vs `BE/prisma/schema.prisma:643-651` | Admin writes the lesson fields `notes`, `quiz`, `document*` and `subTopic`, which are not in the Prisma `CourseLesson` type, so students never receive them. **(confirm Prisma drops undeclared composite fields)** |
| AD5 | Medium | `ADM/backend/src/config/env.js:9,31`; `app.js:20,23`; `ADM/backend/src/middleware/errorHandler.js:6,24` | `NODE_ENV` is missing from `.env`, so the default-JWT-secret guard, the CORS allow-list and stack-trace hiding are all off. |
| AD6 | Medium | `ADM/docker-compose.yml:5,9-10,17,23-24` | There is no Dockerfile, the Mongo port is wrong (2717), the default JWT secret is hardcoded, and Mongo is exposed without auth. |
| AD7 | Medium | `ADM/backend/src/middleware/auth.js:15-17`; `ADM/frontend/src/app/App.jsx:37,235` | The auth middleware never checks `role === 'ADMIN'`. The 24h token is in localStorage and can't be revoked. |
| AD8 | Medium | `course.controller.js:13`, `:22-23`, `:30-38` | The upload URL takes any `folder`, content type and size, so it can write into any prefix of the shared bucket. |
| AD9 | Medium | `ADM/frontend/src/components/AdminCourses.jsx:151-157`, `:193-199`, `:325-331`, `:225-447` | S3 `res.ok` is never checked, so "uploaded" shows and a `videoKey` is saved for files that don't exist. There is no `{success:false}` error branch. |
| AD10 | Medium | `course.controller.js:196-197`, `:212-226` (+ `:243-414`) | Every module or lesson change is a read-modify-write of the whole `modules` array, so concurrent edits lose lessons. Deleting a course leaves enrollments and S3 files behind. |
| AD11 | Medium | `ADM/backend/server.js:8-10`; `ADM/backend/src/config/database.js:7-18` | A failed DB connect at startup is never retried, and the app silently serves fake KPIs and fake people with `success: true`. |
| AD12 | Medium | `ADM/backend/src/modules/jobs/job.controller.js:63-64`; `ADM/backend/src/modules/recruiters/recruiter.controller.js:62-64`; `ADM/frontend/src/app/App.jsx:1723` | Reads non-existent fields (`salaryRange`, `jobType`, `req.skill` instead of `skillName`), so salary, type and skill always show defaults or blanks. |
| AD13 | Medium | `ADM/backend/src/modules/dashboard/dashboard.controller.js:7-8`, `:31`, `:60-67`, `:88`; `ADM/frontend/src/app/App.jsx:280-283` | Inflated or fake KPIs: "Active Jobs" counts all jobs, "Verified" counts self-declared items, storage falls back to a hardcoded "84.5 MB", and trend percentages are hardcoded. |
| AD14 | Medium | `ADM/backend/src/modules/analytics/analytics.controller.js:19,34`; `ADM/backend/src/modules/students/student.controller.js:56-65`; `ADM/backend/src/modules/storage/services/s3Storage.service.js:20-21` | Doesn't scale: full collection loads into memory, an O(n²) profile join, and S3 listing stops at 1000 objects with no paging. |
| AD15 | Low | `course.controller.js:176-180`; `ADM/backend/src/middleware/validate.js:18-28`; `ADM/backend/src/modules/jobs/job.routes.js:8`; `recruiter.controller.js:73`; `ADM/backend/src/config/s3.js:26-35` | Updating a null course gives a 500. Zod v4 has no `err.errors`, so messages come back garbled. The mock branch is unreachable. Only the first verification doc is shown. Unsigned S3 links may return 403. **✅ Partly fixed 2026-11-02: admin `validate.js` now reads zod v4 `issues`.** |
| AD16 | Low | `ADM/backend/src/{controllers,services,validators}/**` | Stale copies of the module code that nothing imports. AD1's credentials are duplicated here too. |

## 16. Documentation drift

| ID | Sev | Location | Issue |
|----|-----|----------|-------|
| D1 | Medium | `CLAUDE.md` | Described the old `backend/`/`frontend/` layout, Supabase storage, a 10s DB probe, and `generateMcqs()` (none of which are current). It omitted admin_ws, gigs, community, payments, courses and `npm test`. **Updated in this audit.** |
| D2 | Medium | `MEMORY.md` | 91 links still point to pre-move `a_g/backend/...` paths. The API map is missing `tests/skills`, `tests/generate`, `tests/submit`, `GET /student/applications`, `intro-video`, `check-username`, `jobs/:id/public`, `PUT /applications/:id/rounds`, `companies/:id`, `media/upload-url` and others. Sections 16–19 are numbered twice. Several items listed as fixed are still open (see A7, S6). |
