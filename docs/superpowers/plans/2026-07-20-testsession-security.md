# TestSession Security Fixes Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close both live skill-verification security holes — the client-supplied score and the answer key sent to the browser — by scoring server-side against a single-use, expiring `TestSession`.

**Architecture:** `generateSkillTest` builds a 10-question test (bank-first, live-generation fallback), stores only the answer-key indices in a `TestSession` row, and returns questions **without** answers plus a `sessionId`. `submitSkillTest` takes `{sessionId, answers[]}`, looks up the session (must belong to the user, be unused and unexpired), scores server-side, marks it used, and updates `verifiedRating` only on pass. Works identically for interim-bank and live-generated questions because the answer key is captured at build time.

**Tech Stack:** Node.js (CommonJS), Express, Prisma 5 + MongoDB, Zod 4, `node:test`, React 19 (frontend).

## Global Constraints

- **Backend strictly CommonJS.** `require`/`module.exports`. No ES module syntax.
- **No TypeScript.** Plain JS. Frontend is React + Tailwind only.
- **Prisma access confined to `repositories/`.** No other backend file imports the Prisma client for `TestSession`.
- **All Prisma queries async/await.**
- **`Skill` is reserved** (embedded type on `Profile.skills`). Not relevant here but do not add a model named `Skill`.
- **Live production Atlas** — no agent `--commit`/`db push`/writes. `npx prisma generate` is safe. Tests stub `config/db` via `require.cache`.
- **Pass threshold: `score >= 7` of 10 (70%).** State this exact value; do not invent a different one.

## Source of truth

- Spec: `docs/superpowers/specs/2026-07-18-question-bank-spine-design.md` §3 (both findings).
- Interim bank context: `HANDOFF_TEMP_QUESTION_BANK.md` (the `Question` model + current bank-first `generateSkillTest`).
- Current vulnerable code: `backend/src/controllers/student.controller.js` — `generateSkillTest`, `getBankTest`, `submitSkillTest`.
- Patterns to mirror: `backend/src/services/questionBank/repositories/skillDefinitionRepository.js` (repository), `backend/src/config/mock/mockClient.js` `question` block (mock), `backend/src/validators/student.validator.js` (Zod).

## Scope

**In:** `TestSession` model + mock + repository; rework of `generateSkillTest` and `submitSkillTest`; the `submitSkillTestSchema` validator; frontend `TestView.jsx` rewiring; tests; doc sync.
**Out:** blueprint/generation pipeline (Plans 3–4), assessment selection blueprint (Plan 5), any change to the interim generator/seed scripts.

---

## Task 1: `TestSession` model, mock, and repository

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/config/mock/mockClient.js`, `backend/src/config/mock/seed.js`
- Create: `backend/src/services/questionBank/repositories/testSessionRepository.js`
- Test: `backend/tests/questionBank/testSessionRepository.test.js`

**Interfaces:**
- Produces:
  - `create({ userId, skillName, answerKey: number[], expiresAt: Date }) → Promise<TestSession>`
  - `findValidForUser(id: string, userId: string) → Promise<TestSession|null>` — null if missing, wrong user, `used`, or expired.
  - `markUsed(id: string, { score: number, passed: boolean }) → Promise<TestSession>`

- [ ] **Step 1: Add the model.** In `schema.prisma`:

```prisma
model TestSession {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @db.ObjectId
  skillName String
  answerKey Int[]     // correctIndex (0-3) per question, in served order — server-side only
  used      Boolean  @default(false)
  score     Int?
  passed    Boolean?
  createdAt DateTime @default(now())
  expiresAt DateTime

  @@index([userId])
}
```

Run `npx prisma generate` (safe, no DB). Verify it succeeds (no `Skill` collision).

- [ ] **Step 2: Mock support.** In `seed.js` add `testSessions: []` to the store. In `mockClient.js` add a `testSession` block mirroring the existing `question` block, implementing:
  - `create({ data })` — push `{ id: 'ts_'+Date.now()+'_'+len, used:false, createdAt:new Date(), ...data }`, return the row.
  - `findUnique({ where:{ id } })` — return matching row or null.
  - `update({ where:{ id }, data })` — merge and return, or null if missing.

- [ ] **Step 3: Write failing repository tests.** In `testSessionRepository.test.js`, stub `config/db` via `require.cache` **before** requiring the repo (copy the header of `skillDefinitionRepository.test.js` exactly). Cover: `create` returns a row with an id; `findValidForUser` returns null for wrong `userId`, for `used:true`, and for `expiresAt` in the past, and the row for a good session; `markUsed` sets `used:true` and stores `score`/`passed`. Use a fake in-memory client injected via a `client` param (add a DI seam like `upsertMany` has).

- [ ] **Step 4: Implement the repository.**

```js
const { prisma } = require('../../../config/db');

async function create({ userId, skillName, answerKey, expiresAt }, client = prisma) {
  return client.testSession.create({ data: { userId, skillName, answerKey, expiresAt, used: false } });
}

async function findValidForUser(id, userId, client = prisma) {
  const s = await client.testSession.findUnique({ where: { id } });
  if (!s || s.userId !== userId || s.used || new Date(s.expiresAt) < new Date()) return null;
  return s;
}

async function markUsed(id, { score, passed }, client = prisma) {
  return client.testSession.update({ where: { id }, data: { used: true, score, passed } });
}

module.exports = { create, findValidForUser, markUsed };
```

- [ ] **Step 5: Run tests, confirm green, commit** (`feat: add TestSession model, mock, and repository`).

---

## Task 2: Build tests without leaking answers (`generateSkillTest` rework)

**Files:**
- Modify: `backend/src/controllers/student.controller.js` (`generateSkillTest`, and refactor the existing `getBankTest` into `buildSkillTest`)

**Interfaces:**
- Consumes: `testSessionRepository.create`; existing `mcqService.generate`; the `Question` model.
- Produces: `POST /student/tests/generate` now returns `{ sessionId, questions:[{ id, question, options }] }` — **no `answer`/`correctIndex`**.

**Design note:** capture the answer key at build time from whichever source produced the questions, so scoring is source-independent.

- [ ] **Step 1: Replace `getBankTest` with `buildSkillTest`** returning both the client-safe questions and the answer key:

```js
// Returns { questions:[{id,question,options}], answerKey:[int] } from the bank
// (>=10) or the live generator. Answers are NEVER included in `questions`.
async function buildSkillTest(skillName) {
  const rows = await prisma.question.findMany({
    where: { skillName: { equals: skillName, mode: 'insensitive' } },
  });
  let picked;
  if (rows && rows.length >= 10) {
    picked = [...rows].sort(() => Math.random() - 0.5).slice(0, 10)
      .map((q) => ({ question: q.question, options: q.options, idx: q.correctIndex }));
  } else {
    const live = await mcqService.generate(skillName); // {questions:[{question,options,answer:'A'-'D'}]}
    picked = (live.questions || []).slice(0, 10)
      .map((q) => ({ question: q.question, options: q.options, idx: 'ABCD'.indexOf(String(q.answer).toUpperCase()) }));
  }
  return {
    questions: picked.map((q, i) => ({ id: i + 1, question: q.question, options: q.options })),
    answerKey: picked.map((q) => q.idx),
  };
}
```

- [ ] **Step 2: Rework the endpoint** to create a session and return no answers:

```js
exports.generateSkillTest = async (req, res) => {
  const { skillName } = req.body;
  if (!skillName) return res.status(400).json({ error: 'skillName is required' });
  try {
    const { questions, answerKey } = await buildSkillTest(skillName);
    if (questions.length < 10 || answerKey.some((i) => i < 0)) {
      return res.status(502).json({ error: 'Could not build a complete test' });
    }
    const session = await testSessionRepo.create({
      userId: req.user.id,
      skillName,
      answerKey,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    });
    res.json({ sessionId: session.id, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error generating skill test' });
  }
};
```

Add `const testSessionRepo = require('../services/questionBank/repositories/testSessionRepository');` at the top with the other requires.

- [ ] **Step 3: Manual check (mock) + commit.** With `npm run dev:mock`, `POST /student/tests/generate {skillName:"Python"}` returns `sessionId` + 10 questions and **no `answer` field** on any question (grep the response). Commit (`feat: issue TestSession and strip answer key from generate`).

---

## Task 3: Server-side scoring (`submitSkillTest` rework) — the core fix

**Files:**
- Modify: `backend/src/controllers/student.controller.js` (`submitSkillTest`)
- Modify: `backend/src/validators/student.validator.js` (`submitSkillTestSchema`)

**Interfaces:**
- Consumes: `testSessionRepository.findValidForUser`, `.markUsed`.
- Produces: `POST /student/tests/submit` accepts `{ sessionId, answers:number[] }`, returns `{ score, total, passed, skills }`. **Never accepts a score.**

- [ ] **Step 1: Change the validator.** Replace `submitSkillTestSchema.body` with:

```js
const submitSkillTestSchema = {
  body: z.object({
    sessionId: z.string().min(1, 'sessionId is required'),
    answers: z.array(z.number().int().min(0).max(3)).min(1, 'answers are required'),
  }),
};
```

- [ ] **Step 2: Rework the endpoint:**

```js
exports.submitSkillTest = async (req, res) => {
  const { sessionId, answers } = req.body;
  if (!sessionId || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'sessionId and answers[] are required' });
  }
  try {
    const session = await testSessionRepo.findValidForUser(sessionId, req.user.id);
    if (!session) {
      return res.status(400).json({ error: 'Invalid, expired, or already-used test session' });
    }

    const key = session.answerKey;
    let correct = 0;
    for (let i = 0; i < key.length; i++) if (answers[i] === key[i]) correct++;
    const score = correct;            // 0-10
    const passed = score >= 7;        // 70% threshold

    await testSessionRepo.markUsed(session.id, { score, passed }); // single-use

    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await prisma.testAttempt.create({
      data: { profileId: profile.id, skillName: session.skillName, score, passed },
    });

    let updatedSkills = [...(profile.skills || [])];
    if (passed) {
      const idx = updatedSkills.findIndex((s) => s.name.toLowerCase() === session.skillName.toLowerCase());
      if (idx !== -1) {
        updatedSkills[idx].verifiedRating = score;
        updatedSkills[idx].rating = Math.max(updatedSkills[idx].rating, score);
      } else {
        updatedSkills.push({ name: session.skillName, rating: score, verifiedRating: score });
      }
      await prisma.profile.update({ where: { id: profile.id }, data: { skills: { set: updatedSkills } } });
    }

    res.json({ score, total: key.length, passed, skills: updatedSkills });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error submitting skill test' });
  }
};
```

- [ ] **Step 3: Manual adversarial check (mock) + commit.** Prove the holes are closed: (a) submitting a fabricated `sessionId` → 400; (b) re-submitting a used session → 400; (c) `verifiedRating` only rises when `score >= 7`. Commit (`fix: score skill tests server-side against single-use TestSession`).

---

## Task 4: Frontend rewiring (`TestView.jsx`)

**Files:**
- Modify: `frontend/src/features/SkillTest/TestView.jsx` (and any test-submit call site — grep for `tests/submit` and `tests/generate`).

**Interfaces:**
- Consumes: new generate response `{ sessionId, questions:[{id,question,options}] }`; new submit contract `{ sessionId, answers:number[] }` → `{ score, total, passed, skills }`.

**Design note:** the component previously received `answer` per question and computed the score locally. That path is gone. Read the current component first; do not assume its state shape.

- [ ] **Step 1: On generate,** store `sessionId` alongside `questions`. Render options as before (no `answer` is present anymore).
- [ ] **Step 2: Track the selected option index (0-3) per question**, in served order, as `answers`.
- [ ] **Step 3: On submit,** POST `{ sessionId, answers }` (not a score). Render the returned `score`/`total`/`passed`. Remove any client-side scoring/`answer` comparison.
- [ ] **Step 4: Manual end-to-end (mock):** `npm run dev:mock` + `npm run dev`, sign up as Student, take a quiz, submit, see a server-scored result. Commit (`feat: submit answers for server-side scoring in TestView`).

---

## Task 5: Tests and documentation sync

**Files:**
- Create: `backend/tests/questionBank/scoring.test.js`
- Modify: `MEMORY.md`, `CLAUDE.md`, `task.md`, `HANDOFF_TEMP_QUESTION_BANK.md`, `docs/superpowers/specs/2026-07-18-question-bank-spine-design.md` (§3 mark resolved)

- [ ] **Step 1: Extract the scoring comparison into a pure exported helper** (e.g. `scoreAnswers(answerKey, answers) → { score, passed }`) and unit-test it: all-correct → 10/pass; 6 correct → not passed; 7 correct → passed; extra/short `answers` arrays don't crash. Stub `config/db` if the helper is required through the controller; prefer putting the pure helper where it needs no DB import.
- [ ] **Step 2: Update docs.** `CLAUDE.md`: the `submitSkillTest` bullet now describes server-side scoring (remove the "no threshold / hardcoded true" language — that vuln is fixed). `MEMORY.md`: add `TestSession` to the schema section and note `generate`/`submit` are now session-based. Mark spec §3 findings resolved. In `task.md` move Plan 2 to complete; in `HANDOFF_TEMP_QUESTION_BANK.md` strike the "still has both security holes" caveat.
- [ ] **Step 3: Full suite green + commit** (`test: cover server-side scoring; docs: mark security findings resolved`).

---

## Self-Review (done at write time)

- **Spec §3 coverage:** Finding 1 (client score trusted) → Task 3 computes `score` server-side from `session.answerKey`; body no longer accepts a score (Task 3 validator). Finding 2 (answer key sent) → Task 2 returns only `{id,question,options}`; the key lives only in `TestSession.answerKey`. ✅
- **Single-use / expiring:** `findValidForUser` rejects `used`/expired; `markUsed` flips `used` before responding. ✅
- **Bank + live parity:** `buildSkillTest` captures `answerKey` from either source. ✅
- **Type consistency:** `answerKey:number[]`, `answers:number[]` (0-3 indices), `create/findValidForUser/markUsed` signatures match across Tasks 1–3. ✅
- **Known follow-ups (not blocking):** expired sessions are left in the collection (no TTL cleanup) — acceptable; add a TTL index later. `buildSkillTest` live-fallback assumes `mcqService` answers are `A`-`D`; a malformed letter yields idx `-1`, caught by the Task 2 `answerKey.some(i => i < 0)` guard → 502.
