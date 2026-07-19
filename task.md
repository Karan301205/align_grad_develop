# AlignGrad — Question Bank Implementation Roadmap

**Last updated:** 2026-07-18
**Branch:** `feat/question-bank-spine`
**Spec:** `docs/superpowers/specs/2026-07-18-question-bank-spine-design.md`
**Plan 1:** `docs/superpowers/plans/2026-07-18-skill-registry-foundation.md`
**Handoff:** `CONTINUATION.md`
**Architecture decisions:** `MEMORY.md` §19

Complexity scale: **S** = under an hour, mechanical · **M** = half a day, some judgment · **L** = a day+, design decisions or risk.

---

## Program structure

The original request was decomposed into seven pieces. Pieces 1–4 are "the spine" and are further
split into five plans. Only Plan 1 has been written; Plans 2–5 need their own `writing-plans` pass
before execution.

| Plan | Contents | Status | Blocked by |
|---|---|---|---|
| **1** | Skill registry foundation | **COMPLETE — 8/8 tasks reviewed** (final whole-branch review pending) | — |
| 2 | `TestSession`, server-side scoring, answer-key stripping (**fixes both security findings**) | Not started | Nothing — independently shippable |
| 3 | `SkillBlueprint` + `TopicProgress`, AI blueprint drafting, CLI approval gate | Not started | Plan 1 |
| 4 | `Question` + `GenerationJob` + `QuestionReviewFlag`, worker process, generation pipeline | Not started | Plans 1, 3 |
| 5 | Assessment read path, selection blueprint, fallback flag | Not started | Plans 1, 2, 4 |

Pieces 5–7 of the original decomposition (admin question-bank UI, generation dashboard, analytics)
are consumers of the spine and are not scheduled yet.

---

## Plan 1 — Skill Registry Foundation

### ✅ Completed

| # | Task | Commits | Complexity | Notes |
|---|---|---|---|---|
| 1 | Test infrastructure (`node:test`) | `c087a34`, `4a1631f` | S | Review found the test script silently skipped subdirectory tests. Fixed. |
| 2 | Skill name normalization | `0ab7c9a` | M | 13 tests. Pure module, no I/O. |
| 3 | Registry seed generation | `fe9e5f7`, `f6d7dd5` | M | Review found the parser scraped commented-out entries. Fixed. 143 defs. |
| 4 | `SkillDefinition` model + repository | `8beccab`, `04843cf` | M | Review found `upsertMany` untested; DI seam + 4 tests added. |
| 5 | Seed CLI (`bank.js`, `seedSkills.js`) | `3f0a6f8`, `4949b53` | S | Reviewed 2026-07-19. Review found `loader()` outside `try` — raw stack on module-load failure (5th plan-code bug). Fixed in code + plan. Dry run still never executed against the DB (deliberate — see BLOCKER 1). |
| 6 | Registry cache + `skillMatching` integration | `48ce2cc` | M | Reviewed 2026-07-19, zero blocking findings. Both comparison sides resolved; cache degrades to identity when unloaded or empty; boot verified against live Atlas (read-only): `loaded 0 skill spellings`. |
| 7 | Normalization migration script (**BUILD ONLY**) | `5190e52`, `a111c96` | L | Reviewed 2026-07-19. Write path never executed — `--commit` is human-only (BLOCKER 1). Review fix: pure logic extracted + 14 fixture tests enforce rating/verifiedRating/minRating preservation. **Operator caveats for the eventual `--commit` run:** (1) TOCTOU — no concurrency guard between the plan read and the full-array write; run during low traffic, after the mandated backup. (2) A profile holding two spellings of one skill ends up with duplicate canonical names — watch for paired lines in the tally. |
| 8 | Mock client support + doc corrections | `76244c3` | S | Reviewed 2026-07-19, zero blocking findings. Offline boot verified: mock mode + `loaded 0 skill spellings`. `CLAUDE.md` false-threshold claim corrected. |

**Test suite: 35/35 passing. ALL 8 TASKS OF PLAN 1 COMPLETE.**

### ⬜ Pending

Nothing — Plan 1's tasks are all complete. Next: final whole-branch review, then the merge
decision and Plan 2 (`TestSession` security fixes).

---

## Blockers

### 🔴 BLOCKER 1 — Live production database

`DATABASE_URL` in `backend/.env` points at a **live MongoDB Atlas cluster with real user data.**

**Standing policy agreed this session: no agent runs writes against it.** Specifically forbidden
without a human at the keyboard:

- `npm run bank -- seed-skills --commit` (writes 143 rows)
- `npm run bank -- normalize-skills --commit` (**rewrites real candidate profiles and job requirements**)
- `npx prisma db push`

Safe: `npx prisma generate`, read-only queries, dry runs, the test suite (which stubs `config/db`).

**To unblock:** either a human runs the `--commit` steps after taking a backup, or a throwaway
`DATABASE_URL` (local `mongod` or scratch Atlas cluster) is supplied so the full flow can be proven
end-to-end first. The second is lower risk and recommended.

### 🟡 BLOCKER 2 — Schema never pushed

`SkillDefinition` exists in `schema.prisma` and the Prisma client is generated, but the collection
does **not** exist in Atlas — no `db push` has run. The `@unique` on `slug` and `@@index([tier, status])`
are therefore unverified against real data. Whoever first pushes must confirm no duplicate-key error.

Blocked by BLOCKER 1.

### 🟡 BLOCKER 3 — Plans 2–5 not written

Only Plan 1 exists. Each remaining plan needs its own `superpowers:writing-plans` pass against the
spec before execution. Plan 2 (security fixes) has no dependencies and can be written at any time.

---

## Deferred findings

Raised by task reviews, deliberately not fixed, to be triaged by the final whole-branch review.

| Location | Finding | Severity |
|---|---|---|
| `normalize.js:14` | `def.aliases` assumed to be an array if truthy; a string would spread character-by-character | Minor |
| `normalize.js:9` | Punctuation allowlist omits `: ' ! @ %` | Minor |
| `generateSkillSeed.js:28` | `TIER_3_EXPLICIT` is dead code — defined, never referenced (inherited from the plan) | Minor |
| `generateSkillSeed.js` | No smoke test on generator output; a tier-casing typo was caught only by a human reading printed counts | Minor |
| `generateSkillSeed.js:134` | `main()` invoked unconditionally, no `require.main === module` guard | Minor |
| `skillDefinitionRepository.js:36-63` | Check-then-act instead of `prisma.upsert()` — non-atomic, up to 2 sequential round-trips per row (~300 for a full seed) | Minor |
| `skillDefinitionRepository.js:13-26` | `return prisma.x.y()` without explicit `await`, inconsistent with controller convention | Minor |

---

## Product bug found (unrelated to the question bank, not fixed)

**`React` is commented out** in `frontend/src/constants/skills.js:138` while `React Native` and
`React Testing Library` are live, and backend `TECHNICAL_SKILLS` contains `react`. If `ALL_SKILLS`
drives the candidate skill picker, **candidates cannot self-rate React while jobs can require it** —
a silent matching failure on the most common frontend skill.

**Complexity: S to fix, M to verify the blast radius.** Needs someone to confirm which components
consume `ALL_SKILLS` before uncommenting.

---

## Security findings — highest priority work in the program

Both documented in spec §3, **neither fixed**. They are the reason Plan 2 is worth pulling forward
ahead of Plans 3–5.

| # | Finding | Location | Complexity |
|---|---|---|---|
| 1 | `submitSkillTest` trusts a client-supplied `score`; `passed` hardcoded `true`. Any candidate can self-assign a verified 10 on any skill and unlock ineligible job applications. | `student.controller.js:354` | **M** |
| 2 | The answer key is returned to the client with the questions. | `prompts.js:4`, `student.controller.js:346` | **S** |

Both are closed by the `TestSession` model: server stores question IDs + key, strips `correctIndex`
from the response, scores server-side, single-use expiring sessions. Because the fallback path also
routes through `TestSession`, runtime-generated questions get the same protection.
