# CONTINUATION — Question Bank Spine

**Session date:** 2026-07-18
**Branch:** `feat/question-bank-spine` (12 commits ahead of `main`, not merged, no PR opened)
**Read order for the next session:** this file → `task.md` → `MEMORY.md` §19 → the spec.

You do **not** need to re-read the repository. Everything needed to resume is below.

---

## 1. What this session did

Took a large "build an Enterprise Question Bank Management System" request and turned it into
executable work:

1. **Decomposed** the request into seven pieces (it was ~10 subsystems, not one feature) and scoped
   pieces 1–4 as "the spine."
2. **Wrote and committed a design spec** through a structured brainstorm — seven binding decisions,
   each with recorded rationale.
3. **Wrote and committed Plan 1** (skill registry foundation), 8 tasks with full code.
4. **Executed Tasks 1–5** via fresh subagents with a review gate after each.

**Every one of Tasks 1–4 had a real defect caught by review.** Three were bugs in my own plan's
code. This is the single most important context for the next session: **the plan's code blocks are
not trustworthy as written — verify against the actual repo before copying them.**

### Plan bugs found and corrected (all fixed in the plan document)

| Bug | Impact if uncaught |
|---|---|
| `node --test tests/` fails on Node 24 — treats `tests` as a test file | Test infra broken from task 1 |
| Test script glob `tests/**.test.js` isn't recursive without `globstar` | **Every later task's tests silently skipped while reporting green** |
| Seed parser regex matched `//`-commented frontend entries | Deliberately-disabled skills resurrected into the registry |
| `config/db.js` exports `{ prisma, isMock }`, not the client | Compiles and passes a module-load check, throws on first real query |
| Plan's registry model named `Skill` | `type Skill` already exists on `Profile.skills` — duplicate declaration, client generation fails |
| Migration filtered `Profile` on `deletedAt` | `Profile` has no such field; Prisma rejects with `Unknown argument` |
| Tier list casing (`Git and GitHub`, `Express js`) | Silently mis-tiered two skills |

---

## 2. Architectural decisions (binding)

Full table in `MEMORY.md` §19. The seven that constrain everything downstream:

1. **Prisma models in `backend/`; generation runs as a separate worker; `admin_ws` triggers work by writing `GenerationJob` documents.** The queue document is the contract between the two backends — no HTTP coupling, one schema owner. `admin_ws` never imports Prisma.
2. **DB-backed `SkillDefinition` registry** is the source of truth for skill identity, with aliases consolidated. Tier and publish status are mutable state, not constants.
3. **Bank-first with runtime LLM fallback** behind a config flag. Ships on Tier 1 with no student-facing regression; coverage becomes a dial, not a launch gate.
4. **AI drafts blueprints, human approves via CLI**, generation blocked until approved. A bad blueprint silently poisons ~300 questions.
5. **Dedup = hash pre-filter + Titan embeddings + in-process cosine**, behind a swappable interface, scoped **within a skill** (never global — a closure question in JS and Python are legitimately different).
6. **Batched reviewer pass**; disagreements flagged for humans, never auto-discarded.
7. **`COMPLETED` ≠ `PUBLISHED`.** Publishing is an explicit operator action.

### Enforced boundaries

- Repositories are the **only** place Prisma is touched. Nothing else under `services/questionBank/` may import the client.
- `similarity/` exposes exactly one interface: `findSimilar(skillId, embedding, threshold)`.
- `services/mcq/` stays and becomes the fallback path only.

---

## 3. Database decisions

### Created (in `schema.prisma`, client generated, **collection not yet pushed to Atlas**)

```prisma
model SkillDefinition {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  canonicalName       String
  slug                String   @unique
  aliases             String[]
  category            String   @default("technical")
  tier                Int      @default(3)
  status              String   @default("WAITING")
  targetQuestionCount Int      @default(300)
  counters            SkillCounters?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  deletedAt           DateTime?
  @@index([tier, status])
}

type SkillCounters {
  totalQuestions Int @default(0)
  validated      Int @default(0)
  topicsReady    Int @default(0)
  topicsTotal    Int @default(0)
}
```

**The model is `SkillDefinition`, never `Skill`** — `type Skill { name, rating, verifiedRating }`
already exists as the embedded type on `Profile.skills`.

Status values are plain strings (`WAITING | GENERATING | PAUSED | REVIEWING | COMPLETED | PUBLISHED`),
matching the existing `User.role` convention rather than a Prisma enum.

### Planned (not yet written)

| Model | Plan | Purpose |
|---|---|---|
| `TestSession` | 2 | `profileId, skillId, questionIds[], correctKey[], status, servedAt, expiresAt` — closes both security findings |
| `SkillBlueprint` | 3 | Versioned; embedded `topics[]` with `weight`, `plannedCount`, `difficultyMix`. Never edited in place — re-drafting supersedes. |
| `TopicProgress` | 3 | Separate from the blueprint because it is high-churn worker state; embedding it would mean rewriting an approved document every batch |
| `Question` | 4 | Includes `embedding Float[]`, `textHash`, and a `stats` subdocument that is **written now and unused** — adding fields to millions of documents later is the expensive migration |
| `GenerationJob` | 4 | The queue; also the audit trail of generation |
| `QuestionReviewFlag` | 4 | Human review queue for reviewer disagreements |

### Migration obligation (Task 7, not yet run)

Alias consolidation requires rewriting existing data. Exact leaf fields:
**`Profile.skills[].name`** and **`Job.requirements[].skillName`**. Every stored `"next js"` must
become `"next.js"` or matching silently breaks for real users.

---

## 4. Security findings — NOT fixed, highest priority in the program

Both in spec §3. Both closed by `TestSession` (Plan 2), which is **independently shippable** ahead
of Plans 3–5.

### 4.1 Skill verification can be bypassed entirely

`backend/src/controllers/student.controller.js:354`

```js
const { skillName, score } = req.body;
const testScore = parseInt(score, 10);
const passed = true;              // hardcoded
updatedSkills[skillIdx].verifiedRating = testScore;
updatedSkills[skillIdx].rating = Math.max(updatedSkills[skillIdx].rating, testScore);
```

`POST /api/student/tests/submit` with `{skillName: "Kubernetes", score: 10}` yields a verified 10
without loading a question. No threshold is applied. Because `rating` is also raised, this
propagates into `skillMatching.service.js` and unlocks ineligible job applications. Recruiters
trust `verifiedRating` — this is the platform's core value proposition.

### 4.2 The answer key is sent to the client

`services/mcq/prompts.js:4` instructs the model to emit an `answer` field per question;
`student.controller.js:346` returns the model output unmodified.

### Doc error

`CLAUDE.md` claims `submitSkillTest` has a `score >= 7` pass threshold. **It does not.** Correcting
this is part of Task 8.

---

## 5. APIs

**None created this session.** No routes were added or changed.

Planned:

| Endpoint | Plan | Notes |
|---|---|---|
| `POST /api/student/tests/generate` (rework) | 2, 5 | Creates a `TestSession`, returns questions with `correctIndex` stripped |
| `POST /api/student/tests/submit` (rework) | 2 | Takes `sessionId` + answers, **never a score**; scores server-side; single-use expiring session |

Operator surface is a CLI, not HTTP: `npm run bank -- <command>`. Currently `seed-skills`; Plan 3
adds blueprint draft/approve, Plan 4 adds enqueue/status.

---

## 6. Files created and modified

### Created

```
docs/superpowers/specs/2026-07-18-question-bank-spine-design.md
docs/superpowers/plans/2026-07-18-skill-registry-foundation.md
backend/scripts/generateSkillSeed.js
backend/src/services/questionBank/skills/normalize.js
backend/src/services/questionBank/skills/seedData.json          # 143 definitions, generated + committed
backend/src/services/questionBank/repositories/skillDefinitionRepository.js
backend/src/cli/bank.js
backend/src/cli/commands/seedSkills.js
backend/tests/smoke.test.js
backend/tests/questionBank/normalize.test.js
backend/tests/questionBank/skillDefinitionRepository.test.js
task.md
CONTINUATION.md
```

### Modified

```
backend/prisma/schema.prisma      # + SkillDefinition, + SkillCounters
backend/package.json              # + "test", + "bank" scripts
MEMORY.md                         # + §20, folder tree, SkillDefinition, removed phantom root package.json
```

### NOT modified (deliberately)

`skillMatching.service.js`, `student.controller.js`, `index.js`, `mockClient.js`, `CLAUDE.md`,
anything under `frontend/`, anything under `admin_ws/`.

---

## 7. Current verified state

- **Test suite: 17/17 passing.** `cd backend && npm test`
- `npm run bank -- --help` works and lists both subcommands.
- `npx prisma generate` succeeds — no duplicate-`Skill` collision.
- Seed data: **143 definitions**, Tier 1 = 9, Tier 2 = 7, Tier 3 = 127.
- `C`, `C++`, `C#` verified as three distinct rows (`c`, `c-plus-plus`, `c-sharp`).
- Working tree clean except one unrelated untracked file: `frontend/public/Karan Rawat_Generated_Resume.pdf`.
- **Nothing has been written to the database. The `SkillDefinition` collection does not exist in Atlas.**

---

## 8. Standing safety policy — carry this forward

`DATABASE_URL` points at a **live production Atlas cluster with real user data.** Agreed this
session: **no agent runs writes against it.**

Forbidden without a human at the keyboard:
- `npm run bank -- seed-skills --commit`
- `npm run bank -- normalize-skills --commit` ← rewrites real candidate profiles and job requirements
- `npx prisma db push`

Safe: `npx prisma generate`, dry runs, read-only queries, `npm test` (stubs `config/db` via
`require.cache` so `db.js`'s startup probe never fires at the live cluster).

---

## 9. EXACT next task

### Review Task 5, then implement Task 6.

**Step 1 — close the Task 5 review gap (do this first, it is small).**

Task 5's CLI is committed at `3f0a6f8` but never passed the review gate — the reviewer dispatch was
cancelled. Tasks 1–4 each had a real defect caught by review; do not assume this one is clean.

Read `docs/superpowers/plans/2026-07-18-skill-registry-foundation.md` Task 5, then review
`backend/src/cli/bank.js` and `backend/src/cli/commands/seedSkills.js` against it. Specifically verify:

- The dry-run path genuinely writes nothing — trace it; `seedSkills.run({commit: false})` must return before `repo.upsertMany`.
- `buildAliasIndex(seedData)` is called **before** any database access, so bad seed data fails loudly rather than half-writing.
- The `normalize-skills` entry in the dispatcher is **lazily** `require`d — the command file does not exist until Task 7, and an eager require would crash the whole CLI today.
- Unknown command exits non-zero.

**Step 2 — implement Task 6** (registry cache + `skillMatching` integration). Full code is in the
plan. Three things the plan calls out that are easy to get wrong:

- Resolution must happen on **both** the map keys in `buildStudentSkillMap` **and** the lookup key in `getMissingRequirements`. Resolving one side makes a canonical name fail to match its own alias.
- When the cache is unloaded, `resolve()` must return **its input unchanged**, never `null`. Returning `null` would make every job match fail if the registry hasn't been seeded — a silent, total outage of job matching.
- `missingRequirements` must keep reporting the **original** `reqSkill.skillName`, not the canonical one. The recruiter's own wording belongs in the UI.

Task 6 also adds a non-fatal `registryCache.load()` at startup in `backend/src/index.js`.

**Method:** this plan was being executed with `superpowers:subagent-driven-development` — fresh
implementer subagent per task, review gate after each. The progress ledger is at
`.superpowers/sdd/progress.md` and task briefs/reports are alongside it. Resuming that flow is
recommended; the review gate has caught a genuine defect in every task so far.

**Do NOT start Task 7** until Task 6 is reviewed and approved — the migration's correctness depends
on the same `buildAliasIndex` resolution the cache uses. If resolution is wrong, the migration
corrupts live data with it.
