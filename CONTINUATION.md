# CONTINUATION — Question Bank (pre-generated bank architecture)

**Last updated:** 2026-07-23
**Branch:** `feat/question-bank-spine` (ahead of `main`, not merged, no PR)
**Read order:** this file → `task.md` → `MEMORY.md` §19 → spec
(`docs/superpowers/specs/2026-07-21-question-bank-architecture-design.md`).

---

## 0. Current status (2026-07-23) — Phases 3–6 complete & DEPLOYED to production Atlas

**DEPLOYED (2026-07-23, user-authorized one-time override of the never-write-prod rule):** seeded 143
SkillDefinitions, 36 SkillRoadmaps, and 4,770 questions to live Atlas; `npm run bank:verify` → ALL
INTEGRITY CHECKS PASSED. Prod totals: 4,785 questions (4,770 ACTIVE + 15 legacy interim rows RETIRED).
During seeding, fixed a latent prod bug: 15 legacy questions had `updatedAt: null` (broke full
`findMany`, would have failed runtime `findActiveBySkill`) — repaired + retired; seed/verify now `select`
only needed fields. NOT pushed to GitHub (per instruction). Read-only smoke test passed for 5 skills.


**Phase 3 (question bank):** ~4,770 MCQs across 36 skills, every subtopic 10/10, strict interview bar.
Lives in `backend/scripts/output/questionBank.json` (+ `.backup.json`). 107 skills (ranks 37–143)
unstarted — need roadmap subtopics rebuilt (names in `backend/src/services/questionBank/skills/seedData.json`;
subtopics were lost with `roadmaps.json` and are NOT in any transcript). Tooling recreated after an
accidental `rm -rf scripts`: `scripts/haikuMerge.js`, `scripts/haikuAuthoringSpec.md`,
`scripts/output/roadmaps.json` (36 skills).

**Phase 4 (assessment integration & usage tracking) — DONE:**
- **Question selection workflow:** request skill → `questionRepo.findActiveBySkill(skill)` (ACTIVE only,
  case-insensitive) → `selection.selectQuestions(pool,{count:10,seed})`. Selection is a pure, seeded
  (deterministic/testable) engine that groups by subtopic, round-robins for spread, targets a balanced
  difficulty mix (`DEFAULT_DIFFICULTY_MIX`), and never repeats a question. Config-driven → extensible.
- **Usage tracking:** on serve, `generateSkillTest` stores `answerKey`+`questionIds` in the `TestSession`
  and calls `questionRepo.recordServed(ids)` → atomic `usageCount +1` + `lastUsed`. On submit,
  `submitSkillTest` classifies each served question from the SERVER-SIDE key (never trusts the client)
  into correct/wrong/skip and calls `recordOutcomes` → atomic `correctCount`/`wrongCount`/`skipCount`.
- **Counter update strategy:** all writes are Mongo atomic `$inc` (Prisma `{ increment }`) via
  `question.updateMany`, batched per bucket (≤1 query for serve, ≤3 for outcomes) → race-safe + few
  queries. Mock parity added in `mockClient.js`.
- **Assessment integration:** bank is the ONLY source; the live `mcqService.generate` fallback was
  removed. If a skill has <10 ACTIVE questions, `generateSkillTest` returns 502 (no dynamic generation).
- **Security:** client serve payload is only `{id,question,options}` with an ordinal id; submit returns
  `results:[{correct}]` — answer key, explanations, tracking metadata, usage stats, and DB ids are never
  exposed. Session is single-use, expiring, owner-checked (Plan 2, unchanged).
- **Tests:** 77/77 pass (12 new in `tests/questionBank/selection.test.js` + `questionRepository.test.js`).

**⚠️ Prod deploy prerequisite:** the bank is currently only in `questionBank.json` and the mock. For a
real Atlas DB, a human must seed `prisma.question` from `questionBank.json` (the `seedQuestionBank.js`
script was deleted in the incident and must be recreated — dry-run default, `--commit` human-only, never
run from an agent; Atlas is production). Until then `prisma.question.findMany` is empty on real DB.

**Phase 5 (Question Bank intelligence & maintenance) — DONE:**
- **Usage-aware selection strategy:** `selection.orderByUsage` orders each subtopic's queue least-used
  first with a seeded random tiebreak, so under-served questions are picked first while subtopic spread,
  difficulty balance, no-dupes, and ACTIVE-only are preserved → traffic distributes across the whole bank.
- **Question health evaluation:** `services/questionBank/health.js` (`evaluateHealth`/`classify`, pure)
  reads usage/correct/wrong/skip/lastReviewed and returns Healthy | Needs Review | Replacement Candidate |
  Retired. Rate-based rules are gated by `minAnswersForRates`/`minUsageForRates` to avoid tiny-sample
  false positives.
- **Configuration strategy:** all thresholds live in `services/questionBank/healthConfig.js`
  (`DEFAULT_HEALTH_CONFIG`); callers may pass a partial override — no code change needed to retune.
- **Replacement workflow:** `services/questionBank/maintenance.js` `runHealthReview({apply})`, exposed via
  CLI `npm run bank -- health-review [--commit]` (dry-run default). FLAG ONLY — sets `Question.reviewState`
  (`NEEDS_REVIEW` / `REPLACEMENT_CANDIDATE`) + `lastReviewed`, atomically, one `updateMany` per state.
  Never regenerates, never deletes, never mutates counters; flagged questions stay `ACTIVE` and served
  until a replacement is approved (a later phase retires the old one + activates the new).
- **Assessment analytics model:** `AssessmentRecord` (candidateId, skill, questionIds[], startedAt/endedAt,
  totalQuestions, correct/wrong/skipped, finalScore, passed). `submitSkillTest` appends one per assessment
  via `assessmentRepository.record` (best-effort, non-blocking). Append-only; history never removed. Data
  collection only — no dashboard.
- **Schema:** `Question.reviewState` (+ index), new `AssessmentRecord` model. `npx prisma generate` run —
  client only, no DB push.
- **Security:** unchanged from Phase 4 — serve payload is `{id,question,options}` only; submit returns
  `results:[{correct}]`; answer key / explanations / usage stats / metadata never exposed. Analytics rows
  hold internal ids but are server-side only (no client endpoint added this phase).
- **Tests:** 93/93 pass (16 new: `health.test.js`, `maintenance.test.js`, `assessmentRepository.test.js`,
  usage-aware selection). E2E (mock) drives real generate→submit: serve/outcome tracking, analytics
  persistence, usage-aware spread, and a full 4,770-question health review all verified.

**Phase 6 (production readiness & operational hardening) — DONE:**
- **Database seeding procedure:** `scripts/seedQuestionBank.js` (`npm run bank:seed [-- --commit]`) —
  dry-run default; validates every record first; idempotent + resumable (dedup by
  skillName+subtopic+normalized question text → skips existing); batched inserts with detailed per-skill
  logs; graceful rollback of the current run on unrecoverable error. HUMAN runs `--commit` against prod.
- **Validation utilities:** `scripts/verifyQuestionBank.js` (`npm run bank:verify [-- --file]`) — integrity
  report over the DB or the JSON file: canonical-skill existence, roadmap existence, subtopic∈roadmap,
  orphans, duplicate ids, duplicate-within-subtopic, missing metadata, invalid difficulty, invalid
  reviewState. Exits non-zero on any failure. Verified clean on the real 4,770-question bank.
- **Performance:** `@@index([skillName, status])` added for the assessment selection hot path; per-skill
  pools are ~120–140 rows so latency stays low. Load test (`scripts/loadTestQuestionBank.js`, mock, 300
  assessments @ concurrency 30): 0 errors, generate avg ~7ms / submit ~8ms, exact atomic counters,
  0 duplicate-within-assessment, 300 analytics rows.
- **Production safety (verified):** serve payload = `{id,question,options}` only; submit returns
  `results:[{correct}]` (no answer key/explanations/metadata); `AssessmentRecord` is append-only (no
  update/delete API); health/maintenance flags never mutate counters; counters use atomic `$inc`.
- **Logging:** standardized non-sensitive prefixes — `[assessment]`, `[health-review]`, `[qbank-seed]`,
  `[qbank-verify]` (ids/counts only; never answer keys or question text).
- **Tests:** 94/94 pass. Full Phase 6 E2E (mock) covers seed dry→commit→idempotent, DB integrity,
  assessment generate/submit, usage tracking, analytics, health review, and safety assertions.

### Production deployment process (operational checklist)
1. Set `DATABASE_URL` to the target Mongo/Atlas (replicaSet for Prisma transactions). Keep `JWT_SECRET`,
   `SUPABASE_*`, etc. per `.env`.
2. `npx prisma generate` (schema already has reviewState, AssessmentRecord, and all indexes).
3. `npm run bank -- seed-skills --commit` (canonical registry) and seed roadmaps.
4. `npm run bank:seed` (dry-run) → review the per-skill counts.
5. `npm run bank:seed -- --commit` (HUMAN) — idempotent; safe to re-run/resume; self-rolls-back on error.
6. `npm run bank:verify` → expect **ALL INTEGRITY CHECKS PASSED**.
7. Smoke-test one assessment (generate → submit) on staging.
8. Ongoing: `npm run bank -- health-review` (dry-run) then `--commit` to flag review candidates.

### Recovery process
- Source of truth for the bank is `backend/scripts/output/questionBank.json` (+ `questionBank.backup.json`).
- Re-seeding is idempotent, so recovery = re-run `bank:seed --commit` (skips what exists, resumes the rest).
- A failed `--commit` deletes only its own inserts (rollback); nothing pre-existing is touched.
- If `questionBank.json` itself is lost, it is reconstructable from subagent transcripts (see the Phase 3
  incident note) — 15 skills were recovered that way before.

**Next:** Question Bank architecture is COMPLETE (Phases 0–6). Only remaining step is the human-run
`bank:seed --commit` against production Atlas. Stop for approval before any new work.

---

## 1. What the recent work did

1. **Phase 0 — architecture migration (2026-07-21).** Deprecated the *Enterprise Question Generation
   Pipeline*. Investigation confirmed it was **never built** (no blueprint engine, worker,
   `GenerationJob` queue, dedup/`similarity`, or reviewer code in `backend/` or `admin_ws/`; no queue
   or embedding dependency). So the migration was **documentation-only** — the registry, interim
   question bank, Plan 2 security, and mcq providers are all kept. New spec written; enterprise spec
   archived (`docs/superpowers/archive/2026-07-18-question-bank-spine-design.md`).
2. **Phase 1 — roadmap storage.** Added the `SkillRoadmap` model, mock support, a pure validator
   (`roadmap/validate.js`), an idempotent seed (`seedRoadmaps.js`), and a mock-only verify harness
   (`verifyRoadmapFlow.js`).
3. **Phase 2 — roadmap generation (DONE).** Ranked the 143 canonical skills and generated a 10-15
   subtopic interview roadmap for **all 143**, persisted immediately + resumably, verified.

**No MCQs/questions were generated.** Phase 3 (question generation) has not started.

---

## 2. Current verified state

- **143/143 canonical skills have a roadmap.** Subtopics 12–14 (avg 13.3). All Phase 2 verification
  checks PASS (exactly one roadmap per skill; 10–15 deduped subtopics; contiguous 1..N ranks; full
  coverage; real mock seed→read roundtrip 143/143).
- **Test suite: 56/56** (`cd backend && npm test`).
- **Nothing written to the database.** `SkillRoadmap` (and the other new collections) are not pushed
  to Atlas. Roadmap data lives in `backend/scripts/output/roadmaps.json` (git-ignored) + a curated
  order in `backend/scripts/skillRanking.json`.
- Generation ran on **Groq `llama-3.3-70b-versatile`** (Bedrock/Claude is 403 billing-blocked).
- **Uncommitted** on `feat/question-bank-spine` (standing policy). Recovery checkpoint: commit
  `e397af1` ("WIP checkpoint before question-bank architecture migration").

---

## 3. Files (Phases 1–2)

**Created**
```
docs/superpowers/specs/2026-07-21-question-bank-architecture-design.md
backend/src/services/questionBank/roadmap/validate.js
backend/src/services/questionBank/roadmap/prompts.js
backend/src/services/questionBank/roadmap/roadmapService.js
backend/src/services/questionBank/roadmap/providers/bedrockProvider.js
backend/src/services/questionBank/roadmap/providers/groqProvider.js
backend/scripts/generateRoadmaps.js
backend/scripts/seedRoadmaps.js
backend/scripts/verifyRoadmapFlow.js
backend/scripts/skillRanking.json
backend/scripts/output/roadmaps.json            # 143 roadmaps (git-ignored)
backend/tests/questionBank/roadmapValidate.test.js
```
**Modified**
```
backend/prisma/schema.prisma      # + SkillRoadmap model (npx prisma generate run — client regenerated)
backend/src/config/mock/mockClient.js + seed.js   # + skillRoadmap mock model
MEMORY.md · task.md · CONTINUATION.md             # architecture migration + Phase 2
```
**Not touched:** all frontend, `admin_ws/`, existing controllers/routes/auth, the registry, the
interim question bank, Plan 2 security, the mcq providers.

---

## 4. Standing safety policy (carry forward)

`DATABASE_URL` points at a **live production Atlas cluster with real user data.** **No agent writes.**
Forbidden without a human: `seedRoadmaps.js --commit`, `seedQuestions.js --commit`,
`bank -- *-skills --commit`, `npx prisma db push`. Safe: `npx prisma generate`, dry runs, read-only
queries, `npm test`, mock-mode scripts. Standalone DB scripts must set `process.env.DATABASE_URL=''`
as their first line and hard-abort unless `isMock()===true` (a bad guard once wrote 15 rows to prod).

---

## 5. EXACT next step

**Stop and wait for human approval before Phase 3 (roadmap-driven question generation).**

When approved, Phase 3 = generate MCQs per (skill, subtopic) using the roadmaps as the syllabus,
reusing the interim generator + providers (Bedrock→Groq), storing into the `Question` model with the
same immediate-persist + resumable + verify pattern as Phase 2. Backend only. Human runs any prod
`--commit`/`db push`.

Also pending (human, BLOCKER 1): `npx prisma db push` + `seedRoadmaps.js --commit` to persist the 143
roadmaps to Atlas (see `task.md` → "Human go-live for roadmaps").
