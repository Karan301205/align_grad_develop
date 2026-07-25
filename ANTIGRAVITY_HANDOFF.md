# Handoff: AlignGrad Question Bank — Phases 0–6 Complete & Deployed

I'm continuing work on **AlignGrad**, a full-stack recruitment platform (React + Vite frontend, Express/CommonJS backend, MongoDB via Prisma). A prior Claude Code session on branch `feat/question-bank-spine` designed and shipped an entire **pre-generated Question Bank subsystem** for skill assessments, in 7 phases (0–6). It is code-complete, tested, and **already seeded into the production Atlas database**. I ran out of tokens in that session — read this fully before touching anything, then continue from "What's left" at the bottom.

**Read `MEMORY.md` and `CONTINUATION.md` in the repo root first** — they have the authoritative, up-to-date architecture notes for this subsystem (search MEMORY.md for "Question", "TestSession", "AssessmentRecord"; CONTINUATION.md has a full phase-by-phase log). This prompt summarizes them but they are the source of truth if anything here seems out of date.

---

## 1. What this subsystem does

Candidates self-rate skills; recruiters set minimum ratings on job requirements. A skill rating can only be **raised** by passing a server-scored MCQ assessment. The Question Bank is what supplies those MCQs:

- **Canonical Skill Registry** (143 skills) — `backend/src/services/questionBank/skills/seedData.json`, resolved via `backend/src/services/questionBank/skills/normalize.js` (alias matching so "JS"/"Javascript"/"JavaScript" all resolve to one canonical name).
- **Skill Roadmaps** (36 skills so far) — `backend/scripts/output/roadmaps.json`, each skill broken into ~10–14 subtopics.
- **Pre-generated Question Bank** — `backend/scripts/output/questionBank.json`, **4,770 MCQs**, exactly 10 per subtopic, strict interview bar (code-output / debugging / scenario / best-practice questions only, no trivia). Covers 36 of the 143 registered skills; 107 unstarted.
- **Assessment Engine** — bank is the *sole* source now; there is no live LLM fallback. `POST /api/student/tests/generate` builds a 10-question test from the bank; `POST /api/student/tests/submit` scores it server-side.
- **Usage tracking, health evaluation, maintenance workflow, and assessment analytics** — described below.

## 2. Data model (Prisma / MongoDB)

```prisma
model Question {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  skillName     String
  subtopic      String
  difficulty    String   // "Medium" | "Medium-Hard" | "Hard"
  question      String
  options       String[] // exactly 4
  correctIndex  Int      // 0-3, NEVER sent to the client
  explanation   String
  tags          String[]
  version       Int      @default(1)
  status        String   @default("ACTIVE")   // ACTIVE | RETIRED | FLAGGED — only ACTIVE is servable
  reviewState   String   @default("NONE")     // NONE | NEEDS_REVIEW | REPLACEMENT_CANDIDATE — maintenance flag, does NOT affect servability
  source        String   @default("temp-bank-groq")
  usageCount    Int      @default(0)
  correctCount  Int      @default(0)
  wrongCount    Int      @default(0)
  skipCount     Int      @default(0)
  lastUsed      DateTime?
  lastReviewed  DateTime?
  lastRegenerated DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([skillName])
  @@index([skillName, subtopic])
  @@index([skillName, status])   // hot path for assessment selection
  @@index([status])
  @@index([reviewState])
}

model TestSession {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @db.ObjectId
  skillName   String
  answerKey   Int[]           // server-only, never sent to client
  questionIds String[]        // which bank Questions were served, for outcome attribution
  used        Boolean  @default(false)
  score       Int?
  passed      Boolean?
  createdAt   DateTime @default(now())
  expiresAt   DateTime        // 30 min TTL, single-use
  @@index([userId])
}

model AssessmentRecord {         // append-only analytics, one row per completed assessment
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  candidateId       String   @db.ObjectId
  skill             String
  questionIds       String[]
  startedAt         DateTime
  endedAt           DateTime
  totalQuestions    Int
  correctAnswers    Int
  wrongAnswers      Int
  skippedQuestions  Int
  finalScore        Int      // 0-100
  passed            Boolean
  createdAt         DateTime @default(now())
  @@index([candidateId])
  @@index([skill])
}
```

`SkillDefinition` (canonical registry) and `SkillRoadmap` models also exist — see `MEMORY.md` for their exact shape.

## 3. Key files (question-bank subsystem)

```
backend/prisma/schema.prisma                                   — models above

backend/src/services/questionBank/
  skills/seedData.json                                         — 143 canonical skills
  skills/normalize.js                                          — buildAliasIndex, resolveSkill
  question/validate.js                                         — validateQuestion, normalizeText, ALLOWED_DIFFICULTY (pre-existing, used by seed/verify scripts)
  roadmap/ (validate module)                                   — roadmap shape validation (pre-existing)
  selection.js                                                 — pure, seeded question-selection engine (usage-aware, subtopic round-robin, difficulty-balanced, no dupes)
  health.js + healthConfig.js                                  — pure question-health classifier (Healthy/Needs Review/Replacement Candidate/Retired), rules externalized in healthConfig.js
  maintenance.js                                                — runHealthReview(): flags reviewState, NEVER regenerates/deletes/touches counters
  repositories/questionRepository.js                            — findActiveBySkill, recordServed, recordOutcomes (atomic $inc), findForReview, setReviewStates
  repositories/testSessionRepository.js                         — TestSession CRUD (create now takes questionIds)
  repositories/assessmentRepository.js                          — record(), findByCandidate() — append-only, NO update/delete

backend/src/controllers/student.controller.js                   — generateSkillTest, submitSkillTest (bank-only, server-side scoring, records analytics + usage, standardized [assessment] logs)
backend/src/config/mock/{mockClient,loadQuestionBankMock,seed}.js — in-memory DB fallback with full parity (atomic increment support, assessmentRecord model, reviewState filtering)
backend/src/cli/bank.js + cli/commands/healthReview.js          — `npm run bank -- health-review [--commit]`

backend/scripts/
  output/questionBank.json                                      — 4,770 MCQs (5.1MB) — ⚠️ GITIGNORED, see §5
  output/roadmaps.json                                          — 36 roadmaps            — ⚠️ GITIGNORED, see §5
  seedQuestionBank.js                                            — production seeding utility (dry-run default, --commit to write, idempotent/resumable, validates everything first, graceful rollback on error)
  verifyQuestionBank.js                                          — integrity report (DB or --file), exits non-zero on any failure
  loadTestQuestionBank.js                                        — concurrency/load test harness (mock-only, refuses to run against a real DB)
  haikuMerge.js, haikuAuthoringSpec.md                            — MCQ-authoring/merge tooling used to build the bank (not needed for deployment, keep for future skill generation)

backend/tests/questionBank/*.test.js                             — 20 files/suites, 94 tests total, all passing (`npm test`)

backend/package.json  → npm scripts added:
  "bank:seed":     "node scripts/seedQuestionBank.js"
  "bank:verify":   "node scripts/verifyQuestionBank.js"
  "bank:loadtest": "DATABASE_URL='' node scripts/loadTestQuestionBank.js"
  "bank":          "node src/cli/bank.js"   (pre-existing; subcommands: seed-skills, normalize-skills, health-review)

MEMORY.md, task.md, CONTINUATION.md                              — updated throughout; CONTINUATION.md §0 has the deployment log and full checklist
```

## 4. Current production state (already live!)

**The bank is already deployed.** The backend's `.env` `DATABASE_URL` points at a **live Atlas cluster serving real users** (this is documented in project memory as a standing hazard — agents must never write to it without explicit human authorization; I had explicit authorization for this one deployment). As of the last session:

| Collection | Count |
|---|---|
| SkillDefinition | 143 |
| SkillRoadmap | 36 |
| Question | 4,785 (4,770 ACTIVE + 15 RETIRED) |

`npm run bank:verify` was run against this live DB and reported **ALL INTEGRITY CHECKS PASSED**.

**A real production bug was found and fixed during that deployment**: 15 legacy questions (12 Python, 3 Java) predating this rebuild had `updatedAt: null`, which is illegal for the schema's non-nullable `DateTime` and made **any unfiltered `prisma.question.findMany()` throw** — this would have broken the live assessment endpoint for Python/Java. Fix applied: backfilled `updatedAt` on those 15 rows, then `RETIRED` them (their subtopics — e.g. "Fixtures" — aren't in any roadmap, so they were orphaned/legacy content anyway). **Because of this, `seedQuestionBank.js` and `verifyQuestionBank.js` now always `select` only the specific fields they need**, never a bare `findMany()` — this is a deliberate defensive pattern, don't revert it to `findMany()` with no `select`.

**Read-only smoke test already run against prod**: 5 skills (Python, JavaScript, AWS, React, Go) each build a clean 10-question, 10-subtopic assessment payload with zero leaked fields (payload is exactly `{id, question, options}` per question).

## 5. What still needs to happen — your friend's migration/deployment task

### If your friend's server points at the SAME Atlas DB as this repo's `.env`
**Nothing to migrate — it's already there.** Just deploy the updated backend code (see §6 for what to commit) and it will read from the same live collections.

### If your friend is deploying to a DIFFERENT database (their own Atlas cluster, a staging DB, etc.)
They need to run the seeding pipeline fresh. Two blockers to solve first:

**(a) `backend/scripts/output/questionBank.json` and `roadmaps.json` are gitignored** (`backend/.gitignore` has `scripts/output/`). A normal `git clone`/`git pull` will NOT include them. Pick one:
   - **Option A (recommended, simplest):** zip `backend/scripts/output/questionBank.json` (5.1MB) + `backend/scripts/output/roadmaps.json` and send them directly (email/Drive/AirDrop/etc.), your friend drops them into the same path in their checkout.
   - **Option B:** force-add them to git despite the ignore rule (`git add -f backend/scripts/output/questionBank.json backend/scripts/output/roadmaps.json`), commit, push. 5.1MB is well under GitHub's 100MB limit, no Git LFS needed. Only do this if you're OK with the question bank content living in a public/shared git history.

**(b) Then your friend runs, in `backend/`, in this exact order:**
```bash
# 1. Point DATABASE_URL at their target Mongo (needs replicaSet param for Prisma transactions)
#    Edit backend/.env, or export DATABASE_URL=...

npx prisma generate                        # regenerate client for their schema

# 2. Seed the canonical skill registry (143 skills) — idempotent, safe to re-run
npm run bank -- seed-skills --commit

# 3. Seed roadmaps (36 skills) — there is currently NO dedicated CLI command for this
#    (seedRoadmaps.js was lost in an earlier incident and never rebuilt — see CONTINUATION.md).
#    Quick inline upsert (adjust the require path if your cwd differs):
node -e '
require("dotenv").config();
const { prisma } = require("./src/config/db");
const rms = require("./scripts/output/roadmaps.json");
(async()=>{
  let c=0,u=0;
  for (const r of rms) {
    const ex = await prisma.skillRoadmap.findUnique({ where:{ skillName:r.skillName } }).catch(()=>null);
    if (ex) { await prisma.skillRoadmap.update({ where:{ skillName:r.skillName }, data:{ popularityRank:r.popularityRank, subtopics:r.subtopics } }); u++; }
    else { await prisma.skillRoadmap.create({ data:{ skillName:r.skillName, popularityRank:r.popularityRank, subtopics:r.subtopics } }); c++; }
  }
  console.log("roadmaps created:", c, "updated:", u);
  process.exit(0);
})();
'
# (Worth building a real `bank -- seed-roadmaps` CLI command for this — see "What's left" below.)

# 4. Dry-run the question bank seed — review counts, confirms nothing writes yet
npm run bank:seed

# 5. Commit for real (idempotent: safe to re-run/resume; rolls back its own inserts on error)
npm run bank:seed -- --commit

# 6. Verify integrity — MUST show "ALL INTEGRITY CHECKS PASSED"
npm run bank:verify
```

If step 6 reports failures, **stop and investigate before going live** — do not manually patch data without understanding why a check failed. The verifier's checks (skill registry membership, roadmap membership, subtopic-in-roadmap, orphans, duplicate ids, duplicate-within-subtopic, missing metadata, invalid difficulty, invalid reviewState) exist because each one maps to a real failure mode that was hit during this build.

**Do not regenerate or re-author any MCQs.** The bank is complete and locked for the 36 covered skills; this phase was explicitly scoped to deployment only, not content changes.

## 6. What to commit (git)

Current branch: `feat/question-bank-spine`. **`git status` shows ~82 changed files — not all of them are from this question-bank work.** Files like `backend/src/controllers/community.controller.js`, `backend/src/services/community/`, `design_stitch/`, `frontend/src/constants/indianStates.js`, and several frontend component edits look like separate in-progress work on this same branch, unrelated to the question bank. **Review those separately — don't bundle them into this commit blindly.**

Files that ARE this question-bank work (safe to commit together):
```
backend/prisma/schema.prisma
backend/src/services/questionBank/selection.js
backend/src/services/questionBank/health.js
backend/src/services/questionBank/healthConfig.js
backend/src/services/questionBank/maintenance.js
backend/src/services/questionBank/repositories/questionRepository.js
backend/src/services/questionBank/repositories/assessmentRepository.js
backend/src/services/questionBank/repositories/testSessionRepository.js
backend/src/controllers/student.controller.js
backend/src/config/mock/mockClient.js
backend/src/config/mock/loadQuestionBankMock.js
backend/src/config/mock/seed.js
backend/src/cli/bank.js
backend/src/cli/commands/healthReview.js
backend/scripts/seedQuestionBank.js
backend/scripts/verifyQuestionBank.js
backend/scripts/loadTestQuestionBank.js
backend/scripts/haikuMerge.js
backend/scripts/haikuAuthoringSpec.md
backend/scripts/RESUME.md                    (recovery notes from an incident — optional to keep)
backend/tests/questionBank/*.test.js         (all files in this dir)
backend/package.json
backend/package-lock.json
frontend/src/features/Student/StudentLayout.jsx   (submit response now reads `results` not `correctAnswers`)
MEMORY.md
task.md
CONTINUATION.md
```
Also deleted (confirm these deletions are intentional — they're superseded by the files above):
```
backend/scripts/generateQuestions.js
backend/scripts/generateSkillSeed.js
backend/scripts/seedQuestions.js        → superseded by seedQuestionBank.js
backend/scripts/verifyBankFlow.js       → superseded by verifyQuestionBank.js
backend/scripts/verifyScoringFlow.js
docs/superpowers/specs/2026-07-18-question-bank-spine-design.md
```

**questionBank.json / roadmaps.json are NOT in this list** — they're gitignored (see §5). Decide separately whether to force-add them.

**Do not push to GitHub without explicit user confirmation right before the push** — this was an explicit instruction in the prior session and should be treated as still standing unless the user says otherwise in this session.

## 7. Safety rules to carry forward (non-negotiable, from project memory)

1. **`backend/.env` `DATABASE_URL` points at live production data.** Never run a write, `prisma db push`, `--commit` flag, or any mutating script against it without explicit, freshly-given user authorization for that specific action. Default to `DATABASE_URL=''` (forces the in-memory mock) for any exploratory/test work.
2. To force the mock DB in a one-off script: `process.env.DATABASE_URL = '';` **before** any `require('../src/config/db')` call, then check `isMock()` (it's a function, call it) before doing anything — a past mistake set the env var incorrectly and wrote to prod.
3. Never run `npm run bank:seed -- --commit`, `npm run bank -- seed-skills --commit`, or the roadmap-seed script against the real DB without the user explicitly re-confirming in the current conversation — a prior blanket approval does not carry forward.
4. `bank:loadtest` already self-guards (`refuses to run against a REAL DB`) — keep that guard if you touch the script.
5. Assessment integrity invariants (verified in tests + E2E, do not regress): the serve payload is exactly `{id, question, options}` per question — no `correctIndex`, `explanation`, `tags`, counters, or internal ids ever reach the client; submit responses return `results: [{correct}]`, never the answer key or `correctAnswers`.
6. `AssessmentRecord` has no `update`/`delete` method on its repository — keep it append-only.
7. Health/maintenance flags (`reviewState`) must never mutate `usageCount`/`correctCount`/`wrongCount`/`skipCount` — those are historical and immutable except via the atomic serve/outcome recorders.

## 8. Verifying your own work

Full test suite: `cd backend && npm test` → expect **94/94 passing**, no other number. If you change `selection.js`, `health.js`, `maintenance.js`, the repositories, or the mock client, re-run this before claiming anything works.

For anything DB-facing, verify in mock first (`DATABASE_URL=''`), and only touch the real DB after the user has explicitly re-confirmed in-session.

## 9. What's left (not blocking, but real gaps)

- **107 of 143 registered skills have no roadmap or questions yet** (only 36 are built). Roadmap subtopics for those 107 were lost in an earlier incident and need to be regenerated before any new MCQ authoring can start — see CONTINUATION.md's incident note for what tooling survived (`haikuMerge.js`, `haikuAuthoringSpec.md`) and what didn't.
- **No dedicated `bank -- seed-roadmaps` CLI command exists** — roadmap seeding currently requires the inline script in §5(b) step 3. Worth building a proper command mirroring `seed-skills`.
- **Phase "Question Health Monitoring & Intelligent Replacement — automatic regeneration"** was explicitly deferred, not started: `maintenance.js` only *flags* questions (`reviewState`), it never regenerates or auto-replaces them. That's the next real feature phase if/when the user wants it — do not build it without an explicit go-ahead, per how every prior phase in this project has been gated.
- **Recruiter-facing analytics dashboard** over `AssessmentRecord` doesn't exist yet — data collection is live, but there's no UI/reporting layer.
- The skip-detection UI path is unexercised: the frontend currently defaults an unanswered question to `0` rather than sending a `-1` skip sentinel, so `skipCount` in production will likely stay near zero until that's wired up (small frontend fix, not urgent).

---

Confirm with me before running any `--commit` flag, `seed-skills --commit`, `db push`, or `git push` — everything else (reading code, running tests, dry-runs, mock-mode work) you can proceed with directly.