# Question Bank Spine — Design

**Date:** 2026-07-18
**Status:** Approved (design), pending implementation plan
**Scope:** Phases 1–4 of the Enterprise Question Bank Management System

---

## 1. Context and scope

The original request describes an end-to-end Enterprise Question Bank Management System: blueprint
engine, weighted distribution, offline generation, multi-stage validation, duplicate detection,
three admin dashboards, search, regeneration, and three analytics domains — plus a future-expansion
list covering versioning, approval workflows, i18n, bulk import/export, audit logs, RBAC, and soft
deletes.

That is a program of work, not a feature. It was decomposed into seven pieces:

1. Question bank data model + skill registry
2. Blueprint engine
3. Offline generation pipeline
4. Assessment engine cutover
5. Admin question bank UI (three-level drill-down)
6. Generation dashboard
7. Analytics (question, then candidate, then recruiter)

**This document specs pieces 1–4 — "the spine."** Pieces 5–7 are consumers of the spine and get
their own spec, plan, and implementation cycles. Nothing in this design should foreclose them.

### Goal

Move MCQ generation offline. Students are served pre-generated, validated questions from MongoDB.
Zero AI calls on the assessment path once coverage is complete.

### Non-goals for this phase

Admin UI beyond a CLI, generation dashboard, search, analytics dashboards, per-question statistics
reporting, i18n, company-specific banks, RBAC, bulk import/export.

---

## 2. Current state

Established by reading the codebase, not assumed:

- **No question storage exists.** `schema.prisma` has 11 models; `TestAttempt` stores a score, not
  questions. Every model here is net-new.
- **Runtime generation is the current path.** `services/mcq/mcqService.js` is 23 lines: Bedrock
  first, Groq fallback, called per assessment.
- **Two backends, one database.** `backend/` uses Prisma (port 5001); `admin_ws/backend/` uses the
  native `mongodb` driver (port 5002).
- **Skill lists are duplicated and drifting.** `TECHNICAL_SKILLS` (backend `Set`) and `ALL_SKILLS`
  (frontend array) are maintained by hand.
- **No test suite** in either workspace.
- **The mock database is hand-maintained.** `config/mock/mockClient.js` implements only the query
  shapes current controllers use.

### Documentation errors found

- `MEMORY.md` lists a root `package.json` in its folder tree. There is none; `CLAUDE.md` is correct.
- `CLAUDE.md` states `submitSkillTest` has a "pass threshold `score >= 7`". No such threshold exists
  in the code.

Both are corrected as part of this work.

---

## 3. Security findings (in scope)

Two live vulnerabilities were found while designing the assessment cutover. Both are fixed here.

### 3.1 Skill verification can be bypassed completely

`backend/src/controllers/student.controller.js:354` — `submitSkillTest` accepts `score` from the
request body and trusts it:

```js
const { skillName, score } = req.body;
const testScore = parseInt(score, 10);
const passed = true;              // hardcoded
updatedSkills[skillIdx].verifiedRating = testScore;
updatedSkills[skillIdx].rating = Math.max(updatedSkills[skillIdx].rating, testScore);
```

A `POST /api/student/tests/submit` with `{skillName: "Kubernetes", score: 10}` yields a verified 10
without loading a question. `passed` is hardcoded, so no threshold is applied. Because `rating` is
also raised, this propagates into `skillMatching.service.js` and unlocks job applications the
candidate is not eligible for.

This defeats the platform's core value proposition: recruiters trust `verifiedRating`.

### 3.2 The answer key is sent to the client

`services/mcq/prompts.js:4` instructs the model to emit an `answer` field per question.
`student.controller.js:346` returns the model output to the client unmodified. Every correct answer
is present in the network response.

### Shipping note

Both fixes depend only on the `TestSession` model (§7) and nothing else in this spec. They are
**independently shippable ahead of the rest of the spine** if the exposure warrants a hot-fix. The
decision to bundle them here was made deliberately, not by omission.

---

## 4. Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Scope = spine (phases 1–4) as one unit | Coherent end-to-end story; dashboards are consumers |
| 2 | Prisma models in `backend/`; generation as a worker; admin triggers via job documents | One schema owner; reuses existing Bedrock provider; queue gives real telemetry; no HTTP coupling between backends |
| 3 | DB-backed `SkillDefinition` registry, aliases consolidated | Tier and publish status are mutable state, not constants; splitting identity from state creates a join on a fragile string |
| 4 | Bank-first with runtime LLM fallback behind a flag | Ships on Tier 1 with no student-facing regression; coverage becomes a dial, not a launch gate |
| 5 | AI drafts blueprints, human approves via CLI, generation blocked until approved | A bad blueprint silently poisons ~300 questions; review costs minutes, regeneration costs money |
| 6 | Hash pre-filter + Titan embeddings + in-process cosine, behind a swappable interface | Semantic paraphrase is the dominant LLM duplicate mode; ~300 vectors/skill fits in memory; Atlas Vector Search swaps in later without data migration |
| 7 | Batched reviewer pass, disagreements flagged for humans | Wrong answer keys are the defect class that destroys trust; the reviewer is sometimes the one in error, so never auto-discard |

### Alias consolidation

The current skill list contains aliases that would each produce a separate blueprint and ~300
duplicate questions:

- `next.js` / `next js`
- `matplotlib` / `seaborn` / `matplotlib & seaborn`
- `data structure` / `data structures & algorithms`
- `agile methodologies` / `agile principles & scrum`
- `genai` / `generative ai`

Left unresolved this is roughly a 5% generation-budget leak plus students receiving near-identical
tests under two names. `natural language processing` and `natural language toolkit (nltk)` are
related but genuinely distinct and stay separate.

---

## 5. Architecture

All new code lives in `backend/`, which already owns Prisma and the Bedrock provider.

### Process model

- **API process** (`src/index.js`, port 5001) — gains a read-only assessment path. Never generates.
- **Worker process** (`npm run worker`) — polls `GenerationJob`, claims atomically, runs the
  pipeline. Separate so long Bedrock runs cannot block HTTP and so it can be stopped, restarted, or
  scaled independently.
- **CLI** (`npm run bank -- <command>`) — operator actions: seed registry, draft blueprint, approve
  blueprint, enqueue skill or topic, inspect status. Makes the approval gate real without waiting on
  the admin dashboard.

### Module layout

```
backend/src/services/questionBank/
├── repositories/     # sole Prisma access — skills, blueprints, questions, jobs
├── blueprint/        # drafting, weighting, approval rules
├── generation/       # planner → generator → reviewer → validator → dedup → writer
├── assessment/       # selection blueprint + read path
├── similarity/       # embedding + cosine, behind one interface
└── index.js          # public surface
```

### Load-bearing boundaries

- **Repositories are the only place Prisma is touched.** Pipeline stages take and return plain
  objects — unit-testable without a database, and storage can change underneath them.
- **`similarity/` exposes one interface**: `findSimilar(skillId, embedding, threshold)`. Swapping
  in-process cosine for Atlas Vector Search is a one-file change.
- **`admin_ws/backend` stays read-only** over these collections and writes `GenerationJob`
  documents to trigger work. It never imports Prisma. The queue document *is* the contract between
  the two backends.
- **`services/mcq/` stays in place** and becomes the fallback path only, called from assessment when
  a skill has no published bank.

---

## 6. Data model

Six new Prisma models. Shapes, not final syntax.

```
SkillDefinition    canonicalName, slug @unique, aliases[], category,
                   tier (1|2|3), status, targetQuestionCount,
                   counters { totalQuestions, validated, topicsReady, topicsTotal },
                   createdAt, updatedAt, deletedAt

SkillBlueprint     skillId, version, status (DRAFT|APPROVED|SUPERSEDED),
                   topics[] { key, name, description, weight, plannedCount,
                              difficultyMix { easy, medium, hard } },
                   plannedQuestionCount, generatorVersion,
                   approvedBy, approvedAt

TopicProgress      skillId, blueprintVersion, topicKey,
                   status (WAITING|GENERATING|REVIEWING|VALIDATED|READY|FAILED),
                   generated, validated, duplicatesRemoved,
                   attempts, lastError, startedAt, completedAt

Question           skillId, topicKey, blueprintVersion,
                   text, textHash, options[4], correctIndex, explanation,
                   difficulty, tags[], concept, estimatedSeconds,
                   embedding Float[], qualityScore,
                   status (PENDING_REVIEW|ACTIVE|FLAGGED|RETIRED),
                   stats { usageCount, correctCount, wrongCount, avgTimeMs, skipCount },
                   generatorVersion, createdAt, updatedAt, deletedAt

GenerationJob      type (BLUEPRINT|TOPIC_GENERATE|TOPIC_REGENERATE),
                   skillId, topicKey, priority,
                   status (QUEUED|CLAIMED|RUNNING|SUCCEEDED|FAILED),
                   claimedBy, claimedAt, heartbeatAt,
                   attempts, maxAttempts, lastError, payload

QuestionReviewFlag questionId, reason (ANSWER_DISAGREEMENT|AMBIGUOUS_OPTIONS|DUPLICATE_SUSPECT),
                   reviewerAnswer, detail,
                   status (OPEN|RESOLVED|DISMISSED), resolvedBy, createdAt
```

### Rationale

- **The registry model is `SkillDefinition`, not `Skill`.** `Skill` is already taken: `schema.prisma`
  declares `type Skill { name, rating, verifiedRating }` as the embedded type on `Profile.skills`.
  A `model Skill` would be a duplicate declaration and fail client generation.
- **`TopicProgress` is separate from `SkillBlueprint`.** The blueprint is approved, immutable
  content; progress is high-churn worker state. Embedding progress would mean rewriting an approved
  document on every batch, and would make "which blueprint version produced this" unanswerable.
- **Blueprints are versioned, never edited in place.** Re-drafting supersedes. Every `Question`
  records its `blueprintVersion`, making "weights changed, regenerate this topic" tractable later.
- **`stats` and `deletedAt` exist now, unused.** This is the one place to build ahead: adding fields
  to millions of documents later is the expensive migration. Writing them today is free.
- **Embeddings live on the `Question` document.** No separate vector collection; at ~300 vectors per
  skill the cosine pass is in-process. The `similarity/` interface hides this.

### Indexes

- `Question`: `{skillId, topicKey, status}`, `{textHash}`, `{skillId, difficulty, status}`
- `GenerationJob`: `{status, priority, createdAt}`
- `SkillDefinition`: unique on `slug`
- `TopicProgress`: unique on `{skillId, topicKey}`

### Migration obligation

Alias consolidation requires a **normalization pass over existing data**. The exact leaf fields are
`Profile.skills[].name` and `Job.requirements[].skillName` — every stored `"next js"` must become
`"next.js"`, or matching silently breaks for real users. Scripted, reversible, dry-run first, backup
before execution. Specced as its own rollout step (§9), not a footnote.

### Seed source

The registry is seeded from **`frontend/src/constants/skills.js` (`ALL_SKILLS`)**, not the backend
`TECHNICAL_SKILLS` set. `ALL_SKILLS` carries display casing (`"Next.js"`, not `"next.js"`) and a
`technical` / `non-technical` flag; only `technical` entries get registry rows, since non-technical
skills (Accounting, Canva, Communication Skills) will never have question banks.

Because the two workspaces are separate npm projects and the frontend file is ESM, seeding uses a
**one-time import script** that parses `ALL_SKILLS` and emits a committed JSON seed file. After
seeding, the database is the source of truth and both hand-maintained lists become legacy.

Note that three tier-listed skills — **Redis, GraphQL, and Go's tier placement** — are not all
present in the current lists (`redis` and `graphql` are absent entirely). Seeding must create them
explicitly rather than silently skipping them.

---

## 7. Assessment read path

### TestSession

```
TestSession   profileId, skillId, questionIds[], correctKey[],
              status (ACTIVE|SUBMITTED|EXPIRED), servedAt, expiresAt
```

**Serving.** The server selects questions, writes a `TestSession` holding question IDs and the
answer key, and returns questions with `correctIndex` stripped. The key never leaves the server.

**Submitting.** The client sends `sessionId` and chosen answers — never a score. The server scores
against the stored key and enforces the threshold server-side. Sessions are single-use and expire,
so they cannot be replayed or farmed. Any `score` field in the request body is ignored outright.

Because the fallback path also goes through `TestSession`, runtime-generated questions get identical
protection. Both findings in §3 are fixed uniformly rather than only for banked skills.

### Selection

Follows the blueprint rather than sampling the skill at random:

- Ten questions allocated across topics proportional to blueprint weight
- Difficulty mix as the blueprint specifies
- Restricted to `status: ACTIVE` — `PENDING_REVIEW` and `FLAGGED` never reach a candidate
- Questions seen in the student's recent sessions excluded, so retakes differ
- Single aggregation using `$facet` — one round trip for all buckets

### Resolution order

1. Normalize the requested skill name through the alias registry to a canonical `SkillDefinition`
2. If `PUBLISHED` with enough `ACTIVE` questions → serve from bank
3. Else if the fallback flag is enabled → call existing `services/mcq/`
4. Else → explicit "assessment not yet available" state

The flag is the dial for retiring runtime inference. It defaults on during rollout and is turned off
once Tier 1 and Tier 2 coverage is sufficient.

### Threshold

**Pass threshold: 7 correct out of 10**, enforced server-side. This matches the intent `CLAUDE.md`
already documents — the doc is not wrong about the intended value, only about it existing in code.
On a pass, `verifiedRating` is set to the raw score (7–10), which is consistent with the existing
1–10 skill rating scale. On a fail, no rating is written and the attempt is still recorded in
`TestAttempt`.

---

## 8. Generation pipeline

A `TOPIC_GENERATE` job runs one topic start to finish. All stages are pure functions over plain
objects except claim and write.

1. **Claim** — atomic `findOneAndUpdate` moves `QUEUED → CLAIMED`, stamping `claimedBy` and
   `claimedAt`. Two workers can never take the same job.
2. **Plan** — load approved blueprint and current `TopicProgress`; compute questions still needed per
   difficulty band. Emits a batch plan of ~10 each.
3. **Generate** — one Bedrock call per batch. Context is deliberately minimal: skill, topic name and
   description, difficulty targets for *this batch*, and stems of already-accepted questions so the
   model steers away from repeats. Never the whole skill.
4. **Validate structurally** — JSON parses, exactly four options, `correctIndex` in range,
   explanation present and non-trivial, difficulty in enum, tags non-empty. Failures dropped and
   counted.
5. **Review** — batched Bedrock call independently answers the ten and compares to the key.
   Agreement → `ACTIVE`. Disagreement or flagged ambiguity → `PENDING_REVIEW` plus an open
   `QuestionReviewFlag`. Never auto-discarded.
6. **Dedup** — `textHash` exact match first, then Titan embedding and cosine against the skill's
   existing vectors. Over threshold → discard, increment `duplicatesRemoved`.
7. **Write** — bulk insert, update `TopicProgress` counters, loop until planned count is met.

Then `TopicProgress → READY`, `SkillDefinition` counters recomputed. When every topic is ready the skill
becomes `COMPLETED`.

**`COMPLETED` is not `PUBLISHED`.** Publishing is a separate, explicit operator action. A skill that
finished generating is not automatically serving students — that gap is where the bank is inspected
before it counts against real candidates.

### Failure handling

This is an unattended process that spends money. Three protections:

- **Resumability is derived, not stored.** After a crash, the plan stage recomputes what is needed
  from the actual validated count in the database. Re-running a partially-complete job is safe and
  idempotent; no reconciliation logic.
- **Stale claims are reaped.** The worker heartbeats while running. A job `CLAIMED` with
  `heartbeatAt` older than the timeout returns to `QUEUED` with `attempts` incremented. Past
  `maxAttempts` it goes `FAILED` and stays visible rather than retrying forever.
- **Spend circuit breaker.** Per-run caps on total Bedrock calls and questions written, plus
  exponential backoff on throttling. A generator that loops — rejecting every batch as duplicate and
  regenerating endlessly — is a genuine financial risk, and bounding it now is far cheaper than
  discovering it on a bill.

---

## 9. Rollout

Steps are not commutative. Order matters.

1. Add models and indexes — purely additive, safe to ship alone
2. Seed the `SkillDefinition` registry with alias mappings — dry-run first, inspect merges
3. Normalize `Profile.skills[]` and `Job.requirements[]` to canonical names — reversible, dry-run,
   backup first. **This is the step that can hurt real users.**
4. `TestSession` plus the two security fixes (§3) — no dependency on steps 1–3
5. Blueprint drafting and CLI approval
6. Worker and generation pipeline
7. Assessment read path with fallback enabled
8. Generate Tier 1, review, publish, verify end to end

### Tiers

- **Tier 1** (generate first): Python, Java, JavaScript, React, Node.js, SQL, Git, Docker, AWS
- **Tier 2**: Redis, MongoDB, Linux, TypeScript, Express, Next.js, Kubernetes
- **Tier 3**: Rust, Terraform, Kafka, ElasticSearch, Go, GraphQL

Remaining skills default to **Tier 3** at seeding and are promoted individually as demand warrants.
Defaulting rather than hand-assigning ~120 tiers keeps seeding mechanical and reversible.

### Question volume target

**Target is ~300 questions per skill**, distributed across topics by blueprint weight — not divided
equally. Weights reflect real interview importance, so core topics (e.g. Functions, OOP) receive
substantially more questions than peripheral ones (e.g. Packaging, Logging). `plannedCount` per
topic is derived from `weight × targetQuestionCount`, and `targetQuestionCount` is stored per skill
so it can be raised for high-traffic skills without changing code.

---

## 10. Testing

No test suite exists in either workspace. Pipeline stages are pure functions specifically so they
can be tested, which is worthless without a runner.

**Add `node:test`** — built into Node, zero dependencies, no framework debate.

Cover the logic where a silent bug is expensive:

- Weighted topic allocation
- Difficulty distribution
- Structural validation
- Dedup thresholds
- Question selection

Repositories and Bedrock calls stay untested for now; value is concentrated in the pure logic.

### Mock database

`mockClient.js` hand-implements each Prisma query shape the controllers use. Six new models with new
query patterns will not be there.

**Implement mock support for the assessment read path only.** Offline development continues to work
through the fallback; generation requires a real database. Full mock support for the pipeline is not
worth maintaining a second implementation of it — and the worker needs Bedrock regardless.

---

## 11. Documentation obligations

This changes architecture, so per `MEMORY.md`'s own rules it must be updated:

- Six new models
- New routes (assessment read path)
- New top-level entry points (worker, CLI)
- New `services/questionBank/` tree
- **Fix:** remove the phantom root `package.json` from the folder tree
- **Fix:** correct the `CLAUDE.md` pass-threshold claim to match the implemented threshold

A developer-facing document covering architecture, data flow, and extension points is a deliverable
of the full program. For this phase, this spec plus the `MEMORY.md` update serve that purpose;
the standalone guide is written once pieces 5–7 land and the picture is complete.

---

## 12. Extension points (deliberately preserved)

Not built now, but nothing here forecloses them:

| Future capability | How the design accommodates it |
|---|---|
| Admin dashboards (pieces 5–6) | `TopicProgress`, `GenerationJob`, and `SkillDefinition.counters` are the read model they render |
| Search | `Question` indexes on skill/topic/difficulty/status; tags stored |
| Question analytics | `Question.stats` subdocument exists and is unused |
| Atlas Vector Search | `similarity/` single interface |
| Question versioning | `blueprintVersion` on every question; blueprints already versioned |
| Retirement / soft delete | `status: RETIRED` and `deletedAt` present |
| Approval workflow | `QuestionReviewFlag` plus `PENDING_REVIEW` status |
| Company-specific banks | `SkillDefinition` registry is DB-backed and extensible |
| Audit logs | `GenerationJob` records are already an audit trail of generation |
