# Question Bank — Architecture (Pre-Generated Bank)

**Date:** 2026-07-21
**Status:** Approved (design), Phase 0 pending execution
**Branch:** `feat/question-bank-spine`
**Supersedes:** `docs/superpowers/specs/2026-07-18-question-bank-spine-design.md` (archived)
**Preserves:** `plans/2026-07-18-skill-registry-foundation.md` (Plan 1, shipped), `plans/2026-07-20-testsession-security.md` (Plan 2, shipped)

---

## 1. Why this document exists

The earlier design (2026-07-18) specced an **Enterprise Question Bank Management System**: a
blueprint engine with weighted distribution and difficulty matrices, an offline generation pipeline
running as a separate worker driven by a `GenerationJob` queue, embedding-based duplicate detection,
a batched reviewer pass with human review flags, and three admin dashboards. That program is
**deprecated**. Its complexity is unwarranted at AlignGrad's current scale.

This document replaces it with a **simpler, production-ready architecture based on a pre-generated
question bank**. The candidate experience is identical — pre-generated MCQs served from MongoDB — but
the machinery behind it is a handful of offline scripts and simple models, not a distributed pipeline.

**Phase 0 (this document's immediate scope) is a migration, not a build.** It removes the deprecated
architecture from the codebase and documentation and records the new design. It does **not** implement
the new workflow and runs **no** generation.

---

## 2. Current state (verified against the repo, 2026-07-21)

Established by reading code, schema, and dependencies — not assumed.

**Built and kept:**

| Piece | Where | Notes |
|---|---|---|
| **Skill registry** | `SkillDefinition` model; `services/questionBank/skills/{normalize,registryCache}.js`; `repositories/skillDefinitionRepository.js`; `cli/bank.js` + commands; `scripts/generateSkillSeed.js`; `skills/seedData.json` | Canonical skill identity + alias resolution. Consumed by `skillMatching.service.js` (both comparison sides) and boot-loaded in `index.js`. Registry collection is **unseeded in production** → matching currently degrades to identity. |
| **Pre-generated bank** | `scripts/generateQuestions.js`, `scripts/seedQuestions.js`; `Question` model; `config/mock/loadQuestionBankMock.js`; bank-first serve in `student.controller.js` | Offline Groq generation → `output/questions.json` → `Question` collection → served bank-first (runtime fallback otherwise). Frontend contract unchanged. |
| **Assessment security (Plan 2)** | `TestSession` model; `repositories/testSessionRepository.js`; `services/questionBank/scoring.js`; `reconcileSkills`, `buildSkillTest`, `generateSkillTest`, `submitSkillTest` in `student.controller.js`; legacy `submitTest` → 410 | Answer key never sent to client; server-side scoring (70% pass); ratings server-owned; single-use, 30-min sessions. Both prior vulnerabilities closed. |
| **LLM generation/fallback** | `services/mcq/{mcqService,prompts}.js`, `providers/{bedrockProvider,groqProvider}.js` | Claude on Bedrock primary → Groq (Llama) fallback. Reused by both the bank generator and the runtime fallback path. |

**Planned but never built** (verified absent: no models in `schema.prisma`, no files, no queue/embedding
dependency in `package.json`): the blueprint engine, the offline generation **worker/queue**
(`GenerationJob`), `SkillBlueprint`, `TopicProgress`, `QuestionReviewFlag`, embedding-based dedup, the
reviewer pass, and the admin generation/analytics dashboards. `admin_ws/` is a standalone admin portal
with **no** generation-pipeline code; the "admin_ws enqueues `GenerationJob` documents" coupling was
part of the unbuilt worker design.

**Standing constraint:** `backend/.env` `DATABASE_URL` points at a **live production MongoDB Atlas
cluster with real user data**. No agent writes, no `prisma db push`. Verification runs via `npm test`
(stubs `config/db`) and `npm run dev:mock`.

---

## 3. Phase 0 — the migration

### 3.1 Code

**Essentially no removal.** The enterprise pipeline was never built, and the registry (the one
substantial pipeline-adjacent artifact) is **kept** by decision. There are no workers, queues,
orchestrators, planners, or dedup/review services in the codebase to delete.

- **Keep** the skill registry intact, including its currently-dormant pipeline metadata fields on
  `SkillDefinition` — `SkillCounters` (`counters`), the generation-lifecycle `status` values, `tier`,
  and `targetQuestionCount`. Only `targetQuestionCount` is referenced in code (written by the seed
  repository); the rest are declared but unread. They are documented here as **legacy/unused**, to be
  simplified or repurposed (e.g. `targetQuestionCount` → coverage target, `tier` → generation priority)
  in the phase that builds the new lifecycle. No schema surgery this phase.
- **Integrity pass only:** confirm the registry, bank, Plan 2, and mcq service remain coherent and the
  test suite stays green. No behavior changes.

### 3.2 Documentation

This is the substance of Phase 0.

| Doc | Action |
|---|---|
| `MEMORY.md` | Rewrite the question-bank sections: drop the enterprise pipeline (blueprint engine, generation worker/queue, `GenerationJob`, embedding dedup, reviewer pass, Plans 3–5, the pipeline architecture decisions, `admin_ws` coupling). Describe the new bank architecture. Correct the folder tree / schema / API notes to match reality. |
| `task.md` | Rewrite the roadmap: remove Plans 3–5 and the enterprise program structure. Record Phase 0 and the new phased plan (§4). Fold in the still-relevant human-only go-live steps from the temp-bank handoff. |
| `CONTINUATION.md` | Rewrite the handoff: new architecture, what is built/kept, exact next steps, standing safety policy. |
| `specs/2026-07-18-question-bank-spine-design.md` | **Archive** to `docs/superpowers/archive/` with a "superseded 2026-07-21" header. Its kept decisions (registry, security, bank-first) carry forward into this spec. |
| `plans/2026-07-18-skill-registry-foundation.md` | **Keep** — documents shipped, kept registry code. |
| `plans/2026-07-20-testsession-security.md` | **Keep** — documents shipped, kept security code. |
| `HANDOFF_TEMP_QUESTION_BANK.md` | Fold the still-useful go-live/testing steps into `task.md`, then **remove** — its "interim ahead of the enterprise pipeline" framing is obsolete. |
| `CLAUDE.md` | Trim any stale enterprise-pipeline references; keep it accurate to the kept architecture. |

**Also updated (agent memory, outside the repo):** the `aligngrad-question-bank-spine` memory is
rewritten to reflect the architecture pivot.

### 3.3 Out of scope for Phase 0

No new models, no roadmap generation, no `Question` lifecycle/usage fields, no replacement routine, and
**no generation runs** (no subtopics or questions generated). No DB writes, no `db push`. Frontend
untouched. `admin_ws/` untouched.

---

## 4. Target architecture (design — built in later phases)

Serve candidates pre-generated MCQs from MongoDB; keep the LLM off the assessment hot path (with a
runtime fallback for uncovered skills). Generation, roadmaps, lifecycle, and replacement are offline
administrative concerns, decoupled from the candidate request path.

1. **Skill catalog.** The skills the bank covers, from the manually-maintained `TECHNICAL_SKILLS`
   (backend) / `ALL_SKILLS` (frontend) lists. The kept `SkillDefinition` registry supplies canonical
   identity + alias resolution. *(Exists.)*

2. **AI-assisted skill roadmap generation.** For a skill, an AI call (Bedrock Claude → Groq fallback)
   drafts a **roadmap**: a flat list of subtopics to cover (e.g. Python → Data Types, Functions & OOP,
   Standard Library, Error Handling, Comprehensions). This is the simplified successor to the blueprint
   engine — no weighted distribution, no difficulty matrices, no versioning, no mandatory CLI approval
   gate. Persisted as a roadmap store (a `SkillRoadmap` model, or `subtopics[]` on `SkillDefinition` —
   decided when built). Today these subtopics are hardcoded in `generateQuestions.js`. *(Design only.)*

3. **AI-assisted question generation.** For each (skill, subtopic), generate N MCQs via the existing
   providers, writing to the `Question` collection. The generator (`generateQuestions.js`) and seed
   (`seedQuestions.js`) exist; the new design makes generation **roadmap-driven** rather than
   hardcoded. *(Generation exists; roadmap wiring is design only. No runs in Phase 0.)*

4. **Question lifecycle management.** Each `Question` carries a simple `status`: `ACTIVE` (servable),
   `RETIRED` (out of rotation), `FLAGGED` (quality issue, pending replacement). Only `ACTIVE` questions
   are served. Far simpler than the enterprise WAITING → … → PUBLISHED lifecycle. *(Design only — a
   `status` field on `Question`.)*

5. **Usage tracking.** Each question accrues `timesServed` (and optionally `timesCorrect` /
   `timesIncorrect`), written on the assessment path when a `TestSession` is built and scored. Surfaces
   overexposed questions (predictable) and miscalibrated ones. *(Design only — usage fields on
   `Question`, incremented in `buildSkillTest` / `submitSkillTest`.)*

6. **Intelligent question replacement.** An offline routine: when a question is overused (`timesServed`
   past a threshold) or `FLAGGED`, generate a fresh MCQ for its (skill, subtopic), mark the old one
   `RETIRED`, and insert the new `ACTIVE` one — refreshing the bank incrementally without full
   regeneration. *(Design only.)*

7. **Assessment serve/score (Plan 2, kept, secure).** `POST /student/tests/generate` builds a
   10-question test from `ACTIVE` bank questions for the skill (random selection; runtime LLM fallback
   if coverage is missing), stores the answer key in a single-use, 30-min `TestSession`, and returns
   options-only questions + `sessionId`. `POST /student/tests/submit` scores server-side (70% pass),
   burns the session, and raises `verifiedRating` only on pass. *(Exists, unchanged.)*

### Data model (target)

- **Kept:** `SkillDefinition` (identity + aliases; legacy pipeline fields retained-unused),
  `Question` (extended later with `status` + usage counters), `TestSession` (Plan 2).
- **New (later phase):** roadmap store (`SkillRoadmap` model or `subtopics[]` on `SkillDefinition`).
- **Dropped from the roadmap (never built):** `SkillBlueprint`, `TopicProgress`, `GenerationJob`,
  `QuestionReviewFlag`.

### Operator surface

Offline scripts (`generateQuestions.js`, `seedQuestions.js`) plus the registry CLI (`npm run bank`).
No generation dashboard, admin generation UI, or queue.

---

## 5. Phasing

- **Phase 0 — migration (this document).** Remove deprecated architecture from code (≈none) and docs;
  record the new design. No new code, no generation, no DB writes.
- **Phase 1+ — build-out (later, each its own `writing-plans` pass, backend-only).** Roadmap store +
  AI roadmap generation; `Question` `status` lifecycle; usage counters + increments on the assessment
  path; the replacement routine. Each honors the live-DB policy (build + dry-run; human runs any
  `--commit`).

---

## 6. Invariants and non-goals

**Security invariants (must continue to hold):** the answer key is never sent to the client; scoring is
server-side only; ratings are server-owned (`reconcileSkills`); sessions are single-use and expiring.

**Non-goals:** enterprise blueprint engine, weighted/difficulty distribution, blueprint versioning +
human approval gate, embedding-based dedup, batched reviewer pass, generation queue/worker, admin
generation dashboards, analytics domains, i18n, company-specific banks, RBAC, bulk import/export.

---

## 7. Verification

- Phase 0 is docs + an integrity pass: `cd backend && npm test` stays green; `npm run dev:mock` boots
  (mock DB, bank auto-loaded) with no regression. No production access.
- Later phases: unit tests for pure logic (roadmap parsing, selection, replacement), DI seams for
  repositories, dry-run tooling for any write path. Human runs `--commit`/`db push` after a backup.
