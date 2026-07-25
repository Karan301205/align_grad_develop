# AlignGrad — Question Bank Roadmap

**Last updated:** 2026-07-21
**Branch:** `feat/question-bank-spine`
**Architecture spec:** `docs/superpowers/specs/2026-07-21-question-bank-architecture-design.md`
**Handoff:** `CONTINUATION.md` · **Reference:** `MEMORY.md` §19

---

## Architecture (pre-generated bank)

Serve candidates pre-generated MCQs from MongoDB; no LLM on the assessment hot path (runtime
fallback for uncovered skills). The earlier **Enterprise Question Generation Pipeline** (blueprint
engine, generation worker + `GenerationJob` queue, Titan-embedding dedup, batched reviewer pass,
admin dashboards) is **deprecated (2026-07-21) and was never built** — no such code ever existed in
the repo. It is replaced by: skill catalog → **AI-assisted skill roadmap** → AI-assisted question
generation → simple question lifecycle → usage tracking → intelligent replacement → secure
serve/score via `TestSession`. See the spec and `MEMORY.md` §19.

---

## Phase status

| Phase | Contents | Status |
|---|---|---|
| **0 — Migration** | Deprecate the enterprise pipeline (docs only — no pipeline code existed); keep the registry, interim bank, Plan 2 security, mcq providers | ✅ Done (2026-07-21) |
| **1 — Roadmap storage** | `SkillRoadmap` model + mock support + `roadmap/validate.js` + `seedRoadmaps.js` + `verifyRoadmapFlow.js` | ✅ Done |
| **2 — Roadmap generation** | Rank 143 canonical skills, generate 10-15 subtopics each, persist immediately, resumable, verify | ✅ **Done — 143/143** |
| **3 — Question generation** | Roadmap-driven MCQ generation into `Question` (reuse interim bank + providers) | ⏸️ **Not started — awaiting approval** |
| 4+ — Lifecycle / usage / replacement | `Question.status` (ACTIVE/RETIRED/FLAGGED), usage counters, intelligent replacement | Design only (spec §4) |

**Kept, shipped work:** Plan 1 (skill registry — `SkillDefinition`, `registryCache`, `normalize`,
CLI, wired into `skillMatching`) and Plan 2 (`TestSession` server-side scoring — both skill-verification
vulnerabilities closed). Records: `docs/superpowers/plans/2026-07-18-skill-registry-foundation.md`,
`docs/superpowers/plans/2026-07-20-testsession-security.md`.

---

## Phase 2 — Skill roadmap generation (DONE 2026-07-21)

**Result: 143/143 canonical skills, subtopics 12–14 (avg 13.3), all verification checks PASS.**

### Workflow
1. **Rank** — `scripts/skillRanking.json` is a curated 1..143 popularity order (Python #1, …),
   reconciled at runtime against the 143 canonical `SkillDefinition` skills (any missing appended by
   tier→name). Determines generation order and each roadmap's `popularityRank`.
2. **Generate** — `scripts/generateRoadmaps.js` → `services/questionBank/roadmap/roadmapService.js`
   (provider-agnostic orchestrator: Claude on Bedrock → Groq fallback) → `roadmap/prompts.js`.
   Bedrock is **403 billing-blocked**, so the run used Groq `llama-3.3-70b-versatile`.
   `GEN_CONCURRENCY` (default 3) + 429 retry. Flags: `--smoke=N`, `--only=Skill`, `--force`.

### Persistence strategy
Each valid roadmap is written to `scripts/output/roadmaps.json` **immediately** after generation —
progress is never lost mid-run. DB persistence is separate: `scripts/seedRoadmaps.js` (dry-run
default; `--commit` upserts by `skillName`, idempotent). **The agent never writes prod** — a human
runs `--commit` (BLOCKER 1). The generator makes **no DB connection** (only LLM APIs + the file).

### Resume strategy
Rerunning `generateRoadmaps.js` loads `roadmaps.json` and **skips any skill that already has a valid
roadmap**; only missing/invalid skills regenerate (`--force` overrides). Proven: the first pass
rate-limited on one skill (Pinecone); a plain rerun completed it to 143/143.

### Verification
`roadmap/validate.js` (`validateRoadmapSet`) + the generator summary confirm: every canonical skill
has exactly one roadmap; 10–15 deduped subtopics each; no duplicate skills; contiguous 1..N ranks;
full coverage. Independently re-checked with a real mock seed→read roundtrip (143/143 rows).
Tooling: 10 unit tests (`tests/questionBank/roadmapValidate.test.js`) + `scripts/verifyRoadmapFlow.js`.
Full suite: **56/56**.

### Human go-live for roadmaps (BLOCKER 1 — not run by the agent)
From `backend/` with the **live `DATABASE_URL` set**:
1. Back up Atlas (manual snapshot).
2. `npx prisma db push` — creates the `SkillRoadmap` collection (BLOCKER 2).
3. `node scripts/seedRoadmaps.js` (dry run) → expect 143 valid.
4. `node scripts/seedRoadmaps.js --commit` → upserts 143 roadmaps.
Lower-risk alternative: prove steps 2–4 against a throwaway `DATABASE_URL` first.

**Note:** `scripts/output/roadmaps.json` is the reviewable blueprint but sits in the git-ignored
`scripts/output/` dir. Consider committing it (relocate or un-ignore) if you want it version-controlled.

---

## Blockers

### 🔴 BLOCKER 1 — Live production database
`DATABASE_URL` in `backend/.env` points at a **live MongoDB Atlas cluster with real user data.**
**No agent writes.** Forbidden without a human: `seedRoadmaps.js --commit`, `seedQuestions.js
--commit`, `seed-skills/normalize-skills --commit`, `npx prisma db push`. Safe: `npx prisma generate`,
dry runs, read-only queries, `npm test`, and mock-mode scripts (`DATABASE_URL=''` + `isMock()` guard).

### 🔴 BLOCKER 2 — Bedrock (Claude) billing
`CLAUDE_API_KEY` returns `403 INVALID_PAYMENT_INSTRUMENT` — the AWS account has no valid payment
instrument for the Bedrock Marketplace model. A **human** must fix AWS Billing; a different key only
helps if it belongs to a properly-billed account. Until then, generation uses the Groq fallback.

### 🟡 BLOCKER 3 — Schema collections not pushed
`SkillRoadmap` (and `SkillDefinition`, `Question`, `TestSession`) exist in `schema.prisma` and the
client is generated, but the collections are **not pushed** to Atlas. Blocked by BLOCKER 1.

---

## Interim question bank (kept)
`scripts/generateQuestions.js` → `scripts/output/questions.json` (500 Qs) → `Question` model →
`generateSkillTest` serves bank-first. Runs on the mock via `npm run dev:mock`. This is the seed of
the Phase 3 question generation, which will become roadmap-driven.

## Security findings — RESOLVED (Plan 2)
Both skill-verification holes are closed: `submitSkillTest` scores server-side against a single-use
`TestSession` key (client submits `{sessionId, answers[]}`, never a score; 70% pass); the answer key
is never sent to the client. Ratings are server-owned (`reconcileSkills`); legacy `POST
/student/tests` is 410.

---

## Next (historical — Phase 2 endpoint)
**Stopped for human approval before Phase 3 (roadmap-driven question generation).** No MCQs were
generated in Phase 2.

---

## Phase 3 — COMPLETE (2026-07-23)
Pre-generated question bank built: **~4,770 interview MCQs, 36 skills, every subtopic 10/10**,
strict bar (code-output / debugging / scenario / best-practice only). Output:
`backend/scripts/output/questionBank.json` (+ `questionBank.backup.json`). Tooling:
`scripts/haikuMerge.js` (self-contained validate+dedup+merge, dir mode), `scripts/haikuAuthoringSpec.md`,
`scripts/output/roadmaps.json` (36 skills). Remaining 107 skills (ranks 37–143) are unstarted and need
roadmap subtopics rebuilt first (names in `src/services/questionBank/skills/seedData.json`).
Incident: an errant `rm -rf scripts` deleted the bank mid-Phase-3; 15 skills were recovered from
subagent transcripts, 20 regenerated — net no permanent loss. Safeguard: never chain `rm` after `cd`;
keep `questionBank.backup.json` current.

## Phase 4 — COMPLETE (2026-07-23): Assessment integration & usage tracking
- **Selection engine** `services/questionBank/selection.js` — pure, seeded (deterministic/testable),
  ACTIVE-only, subtopic-distributed, difficulty-balanced, no duplicates. Extensible via config.
- **Question repo** `services/questionBank/repositories/questionRepository.js` — `findActiveBySkill`,
  `recordServed` (atomic usageCount+lastUsed), `recordOutcomes` (atomic correct/wrong/skip). All
  `$inc` atomic (Prisma `{increment}`); mock parity in `mockClient.js` (`updateMany`/`update`/`findUnique`).
- **Controller** `student.controller.js` — `buildSkillTest` bank-only (live fallback removed);
  `generateSkillTest` stores `questionIds` + records serve; `submitSkillTest` classifies from the
  server-side key and records outcomes; response returns `results:[{correct}]` (no answer key).
- **Schema** `TestSession.questionIds String[]` added (`npx prisma generate` run — client only, no DB push).
- **Integrity** verified: client payload is only `{id,question,options}` (ordinal id); answers/
  explanations/metadata/usage/internal ids never exposed.
- **Tests**: `tests/questionBank/selection.test.js` + `questionRepository.test.js` (12 new); full suite
  **77/77 pass**. E2E mock check confirms selection + tracking against the real 4,770-question bank.

## Phase 5 — COMPLETE (2026-07-23): Question Bank intelligence & maintenance
- **Usage-aware selection** (`selection.js`): within each subtopic, least-used first with a seeded
  tiebreak among equal usage (`orderByUsage`), preserving subtopic spread, difficulty balance, no dupes,
  ACTIVE-only. Prevents a small subset from being overused.
- **Health evaluation** (`health.js` + `healthConfig.js`): pure `evaluateHealth(q, config)` →
  Healthy | Needs Review | Replacement Candidate | Retired, from usage/correct/wrong/skip/lastReviewed.
  Rules are configurable (thresholds in `healthConfig.js`; gated by min answers/usage to avoid
  tiny-sample false positives). `classify()` tallies a bank.
- **Replacement workflow** (`maintenance.js` + CLI `npm run bank -- health-review [--commit]`): flags
  questions via `Question.reviewState` (NONE | NEEDS_REVIEW | REPLACEMENT_CANDIDATE) + `lastReviewed`.
  FLAG ONLY — never regenerates, never deletes, never touches counters. Flagged questions keep
  `status=ACTIVE` (still served) until a replacement is approved in a later phase.
- **Assessment analytics** (`AssessmentRecord` model + `assessmentRepository.js`): `submitSkillTest`
  appends one immutable record per assessment (candidate, skill, questionIds, start/end, totals,
  correct/wrong/skip, finalScore, passed). Append-only; existing `TestAttempt` kept. No dashboard.
- **Schema**: `Question.reviewState` + index; new `AssessmentRecord` model (`npx prisma generate` — no DB push).
- **Tests**: `health.test.js`, `maintenance.test.js`, `assessmentRepository.test.js`, usage-aware
  selection tests → **93/93 pass**. E2E (mock) drives generate→submit: tracking, analytics, usage-aware
  spread, and a full-bank health review all verified.

## Phase 6 — COMPLETE (2026-07-23): Production readiness & operational hardening
- **Seeding utility** `scripts/seedQuestionBank.js` (`npm run bank:seed [-- --commit]`): dry-run default,
  validates every record before writing (aborts on invalid), idempotent + resumable (skips questions
  already present by skillName+subtopic+normalized-text), batched inserts, detailed per-skill logs,
  graceful rollback of the current run on unrecoverable error. HUMAN-run for prod (`--commit`); never
  from an agent.
- **Integrity verifier** `scripts/verifyQuestionBank.js` (`npm run bank:verify [-- --file]`): checks
  canonical-skill existence, roadmap existence, subtopic-in-roadmap, orphans, dup ids, dup-within-subtopic,
  missing metadata, invalid difficulty, invalid reviewState → detailed report + non-zero exit on failure.
  Verified clean against the real 4,770-question bank (all 8 checks pass, 36/36 skills mapped).
- **Performance:** added `@@index([skillName, status])` for the hot selection query; per-skill pools are
  small (~120–140 rows) so gen/submit stay low-latency. Repos already minimal-query (1 read + 1–3 atomic
  writes). Load test (mock, 300 assessments, concurrency 30): 0 errors, gen avg ~7ms / submit ~8ms, exact
  atomic counters (3000 usage == 3000 served), 0 duplicate-within-assessment, 300 analytics rows.
- **Production safety** (verified in E2E + tests): no answer key/metadata in serve payload or submit
  response; analytics repo is append-only (no update/delete); review flags never mutate counters; counters
  are atomic `$inc`.
- **Logging:** standardized non-sensitive logs — `[assessment] generated/submitted` (ids+counts, no keys),
  `[health-review]`, `[qbank-seed]`, `[qbank-verify]`; validation failures + errors logged.
- **Tests:** 94/94 pass (added append-only immutability test). Full Phase 6 E2E (mock) validates seeding
  (dry→commit→idempotent), DB integrity, assessment flow, tracking, analytics, health review, and safety.

### Production deployment / operational checklist
1. Point `DATABASE_URL` at the target Mongo (Atlas, replicaSet for Prisma transactions).
2. `npx prisma generate` (client already includes reviewState + AssessmentRecord + indexes).
3. Seed skills & roadmaps: `npm run bank -- seed-skills --commit` (+ roadmap seed).
4. Dry-run the bank seed: `npm run bank:seed` → review counts.
5. Commit the bank (HUMAN): `npm run bank:seed -- --commit` (idempotent; safe to re-run/resume).
6. Verify: `npm run bank:verify` → expect ALL INTEGRITY CHECKS PASSED.
7. Smoke-test one assessment (generate → submit) against staging.
8. Periodic maintenance: `npm run bank -- health-review` (dry-run) → `--commit` to flag.
- **Recovery:** the bank source of truth is `scripts/output/questionBank.json` (+ `.backup.json`). Re-seed
  is idempotent; a failed `--commit` rolls back its own inserts, and re-running resumes. If the file is
  lost, it is reconstructable from subagent transcripts (see the incident note above).

## PRODUCTION DEPLOYMENT — DONE (2026-07-23, user-authorized prod-write override)
- Seeded to live Atlas: **143 SkillDefinitions, 36 SkillRoadmaps, 4,770 questions**. `bank:verify` = ALL PASSED.
- Prod totals: 4,785 questions = 4,770 ACTIVE + 15 legacy RETIRED.
- Found & fixed a latent prod bug: 15 legacy interim-bank questions (12 Python, 3 Java) had `updatedAt: null`,
  which broke full `prisma.question.findMany()` (would have failed runtime `findActiveBySkill`). Repaired the
  timestamps, then RETIRED them (off-roadmap "Fixtures" subtopics). Hardened `seedQuestionBank.js` /
  `verifyQuestionBank.js` to `select` only needed fields (robust to null-timestamp rows).
- Read-only smoke test: Python/JavaScript/AWS/React/Go each build a clean 10-question, 10-subtopic
  assessment with no leaked fields. (Write-path — usage/analytics — proven via mock E2E + 300-assessment
  load test; not run against prod to avoid polluting it with test data.)
- NOT pushed to GitHub (per instruction); code changes are in the working tree only.

## Next
**Question Bank architecture COMPLETE (Phases 0–6) and DEPLOYED.** Awaiting approval for any further work.
