# Skill Registry Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a database-backed canonical skill registry with alias consolidation, and normalize all existing skill references in live data to canonical names.

**Architecture:** A new `SkillDefinition` Prisma model becomes the source of truth for skill identity, tier, and status. Pure normalization functions map any alias spelling to a canonical name. A CLI seeds the registry from the frontend's `ALL_SKILLS` list and runs a reversible migration over `Profile.skills[].name` and `Job.requirements[].skillName`. The hot job-matching path reads a cached in-memory projection so per-match latency is unchanged.

**Tech Stack:** Node.js (CommonJS), Express, Prisma 5.12 + MongoDB, `node:test` (new), Zod 4.

## Global Constraints

- **Backend is strictly CommonJS.** Use `require`/`module.exports`. No ES module syntax anywhere in `backend/`.
- **No TypeScript.** Plain JavaScript only.
- **All Prisma queries are async/await.**
- **Prisma access is confined to `repositories/`.** No other file in `services/questionBank/` may import the Prisma client.
- **`Skill` is a reserved name.** `schema.prisma` already declares `type Skill { name, rating, verifiedRating }` on `Profile.skills`. The registry model is `SkillDefinition`.
- **Every destructive script must support `--dry-run` and default to it.** Writes require an explicit `--commit` flag.
- **Node version floor: 18** (required for `node:test`).

## Source of Truth References

- Spec: `docs/superpowers/specs/2026-07-18-question-bank-spine-design.md`
- Existing skill lists: `frontend/src/constants/skills.js` (`ALL_SKILLS`, display-cased, has `technical` flag), `backend/src/constants/technicalSkills.js` (`TECHNICAL_SKILLS`, lowercase Set)
- Matching consumer: `backend/src/services/skillMatching.service.js`

## Scope

This is **Plan 1 of a series** covering spec phases 1–4. This plan delivers only the skill registry and data normalization. Subsequent plans cover: question bank models + `TestSession` and the security fixes (Plan 2), blueprint engine (Plan 3), generation pipeline (Plan 4), assessment read path (Plan 5).

**Out of scope here:** `Question`, `SkillBlueprint`, `TopicProgress`, `GenerationJob`, `QuestionReviewFlag`, `TestSession` models; any Bedrock calls; any frontend change.

## File Structure

| File | Responsibility |
|---|---|
| `backend/src/services/questionBank/skills/normalize.js` | **Create.** Pure functions: token normalization, alias index construction, resolution. No I/O. |
| `backend/src/services/questionBank/skills/seedData.json` | **Create.** Generated, committed registry seed. |
| `backend/scripts/generateSkillSeed.js` | **Create.** One-time importer parsing frontend `ALL_SKILLS` into `seedData.json`. |
| `backend/src/services/questionBank/repositories/skillDefinitionRepository.js` | **Create.** Sole Prisma access for `SkillDefinition`. |
| `backend/src/services/questionBank/skills/registryCache.js` | **Create.** Boot-time cached alias index for the hot matching path. |
| `backend/src/cli/bank.js` | **Create.** CLI entry point with subcommand dispatch. |
| `backend/src/cli/commands/seedSkills.js` | **Create.** `bank seed-skills` implementation. |
| `backend/src/cli/commands/normalizeSkillNames.js` | **Create.** `bank normalize-skills` data migration. |
| `backend/prisma/schema.prisma` | **Modify.** Add `SkillDefinition` model. |
| `backend/src/services/skillMatching.service.js` | **Modify.** Resolve names through the registry cache. |
| `backend/src/config/mock/mockClient.js` | **Modify.** Add `skillDefinition` model support. |
| `backend/package.json` | **Modify.** Add `test` and `bank` scripts. |
| `backend/tests/questionBank/normalize.test.js` | **Create.** Unit tests for normalization. |
| `backend/tests/questionBank/registryCache.test.js` | **Create.** Unit tests for cache resolution. |

---

## Task 1: Test infrastructure

**Files:**
- Modify: `backend/package.json`
- Test: `backend/tests/smoke.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `npm test` in `backend/` runs `node --test` over `backend/tests/`. All later tasks depend on this working.

- [ ] **Step 1: Write a smoke test that fails**

Create `backend/tests/smoke.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');

test('test runner is wired up', () => {
  assert.strictEqual(1 + 1, 2);
});

test('this failure proves the runner actually runs assertions', () => {
  assert.strictEqual(1 + 1, 3);
});
```

- [ ] **Step 2: Add the test script**

In `backend/package.json`, add to `scripts`:

```json
"test": "node --test \"tests/**/*.test.js\""
```

The full `scripts` block becomes:

```json
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "test": "node --test \"tests/**/*.test.js\""
}
```

- [ ] **Step 3: Run and verify the deliberate failure is reported**

Run: `cd backend && npm test`
Expected: FAIL. Output contains `# fail 1` and names `this failure proves the runner actually runs assertions`. This confirms the runner is not silently passing.

- [ ] **Step 4: Remove the deliberate failure**

Replace `backend/tests/smoke.test.js` with:

```js
const test = require('node:test');
const assert = require('node:assert');

test('test runner is wired up', () => {
  assert.strictEqual(1 + 1, 2);
});
```

- [ ] **Step 5: Run and verify green**

Run: `cd backend && npm test`
Expected: PASS. Output contains `# pass 1` and `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/tests/smoke.test.js
git commit -m "test: add node:test runner to backend"
```

---

## Task 2: Skill name normalization

**Files:**
- Create: `backend/src/services/questionBank/skills/normalize.js`
- Test: `backend/tests/questionBank/normalize.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `normalizeToken(raw: string) → string` — lowercases, collapses punctuation to spaces, trims. Returns `''` for non-strings.
  - `buildAliasIndex(definitions: Array<{canonicalName: string, aliases?: string[]}>) → Map<string, string>` — maps normalized token to canonical name. **Throws** on collision between two different canonical names.
  - `resolveSkill(aliasIndex: Map, rawName: string) → string | null` — canonical name or null.

**Design note for the implementer:** two distinct mechanisms are needed and neither replaces the other. `normalizeToken` handles *punctuation* variants (`"Next.js"` vs `"next js"`) mechanically. Explicit `aliases` handle *semantic* variants (`"Data Structure"` vs `"Data Structures & Algorithms"`) which no string rule could infer. Do not try to collapse these into one mechanism.

**Critical:** `+` and `#` must NOT be stripped. `C`, `C++`, and `C#` are three different skills, and stripping `+` would collapse `C++` into `C`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/questionBank/normalize.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const {
  normalizeToken,
  buildAliasIndex,
  resolveSkill,
} = require('../../src/services/questionBank/skills/normalize');

test('normalizeToken lowercases and trims', () => {
  assert.strictEqual(normalizeToken('  Python  '), 'python');
});

test('normalizeToken collapses punctuation variants to the same token', () => {
  assert.strictEqual(normalizeToken('Next.js'), normalizeToken('next js'));
  assert.strictEqual(normalizeToken('Node.js'), 'node js');
  assert.strictEqual(normalizeToken('UI/UX'), 'ui ux');
});

test('normalizeToken preserves + and # so C, C++, C# stay distinct', () => {
  assert.strictEqual(normalizeToken('C'), 'c');
  assert.strictEqual(normalizeToken('C++'), 'c++');
  assert.strictEqual(normalizeToken('C#'), 'c#');
  assert.notStrictEqual(normalizeToken('C++'), normalizeToken('C'));
  assert.notStrictEqual(normalizeToken('C#'), normalizeToken('C'));
});

test('normalizeToken handles leading-punctuation names', () => {
  assert.strictEqual(normalizeToken('.NET'), 'net');
});

test('normalizeToken returns empty string for non-strings', () => {
  assert.strictEqual(normalizeToken(null), '');
  assert.strictEqual(normalizeToken(undefined), '');
  assert.strictEqual(normalizeToken(42), '');
});

test('buildAliasIndex maps canonical name to itself', () => {
  const index = buildAliasIndex([{ canonicalName: 'Python' }]);
  assert.strictEqual(index.get('python'), 'Python');
});

test('buildAliasIndex maps explicit aliases to the canonical name', () => {
  const index = buildAliasIndex([
    { canonicalName: 'Generative AI', aliases: ['GenAI'] },
  ]);
  assert.strictEqual(index.get('genai'), 'Generative AI');
  assert.strictEqual(index.get('generative ai'), 'Generative AI');
});

test('buildAliasIndex throws when two canonicals claim the same token', () => {
  assert.throws(
    () =>
      buildAliasIndex([
        { canonicalName: 'Next.js' },
        { canonicalName: 'Next js' },
      ]),
    /collision/i
  );
});

test('buildAliasIndex does not throw when a canonical repeats its own token', () => {
  assert.doesNotThrow(() =>
    buildAliasIndex([{ canonicalName: 'Python', aliases: ['python', 'Python'] }])
  );
});

test('buildAliasIndex ignores empty alias entries', () => {
  const index = buildAliasIndex([{ canonicalName: 'Python', aliases: ['', null] }]);
  assert.strictEqual(index.size, 1);
});

test('resolveSkill returns the canonical name for any known spelling', () => {
  const index = buildAliasIndex([
    { canonicalName: 'Next.js', aliases: ['Next js'] },
  ]);
  assert.strictEqual(resolveSkill(index, 'NEXT.JS'), 'Next.js');
  assert.strictEqual(resolveSkill(index, 'next js'), 'Next.js');
});

test('resolveSkill returns null for unknown skills', () => {
  const index = buildAliasIndex([{ canonicalName: 'Python' }]);
  assert.strictEqual(resolveSkill(index, 'Cobol'), null);
  assert.strictEqual(resolveSkill(index, ''), null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npm test`
Expected: FAIL with `Cannot find module '../../src/services/questionBank/skills/normalize'`

- [ ] **Step 3: Write the implementation**

Create `backend/src/services/questionBank/skills/normalize.js`:

```js
// Pure skill-name normalization. No I/O, no Prisma — safe to unit test directly.
//
// Two mechanisms work together and neither subsumes the other:
//   1. normalizeToken() folds PUNCTUATION variants  ("Next.js" === "next js")
//   2. explicit aliases fold SEMANTIC variants      ("Data Structure" -> "Data Structures & Algorithms")
//
// `+` and `#` are deliberately preserved: C, C++ and C# are distinct skills.

const PUNCTUATION = /[._\-/&,()]+/g;
const WHITESPACE = /\s+/g;

function normalizeToken(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    .replace(PUNCTUATION, ' ')
    .replace(WHITESPACE, ' ')
    .trim();
}

// Builds a lookup from every known spelling to its canonical name.
// Throws on genuine collisions so bad seed data fails loudly at boot rather
// than silently routing two skills to one bank.
function buildAliasIndex(definitions) {
  const index = new Map();

  for (const def of definitions) {
    const spellings = [def.canonicalName, ...(def.aliases || [])];

    for (const spelling of spellings) {
      const key = normalizeToken(spelling);
      if (!key) continue;

      const existing = index.get(key);
      if (existing && existing !== def.canonicalName) {
        throw new Error(
          `Skill alias collision: "${spelling}" maps to both "${existing}" and "${def.canonicalName}"`
        );
      }
      index.set(key, def.canonicalName);
    }
  }

  return index;
}

function resolveSkill(aliasIndex, rawName) {
  const key = normalizeToken(rawName);
  if (!key) return null;
  return aliasIndex.get(key) || null;
}

module.exports = { normalizeToken, buildAliasIndex, resolveSkill };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npm test`
Expected: PASS. `# fail 0`, 13 passing tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/questionBank/skills/normalize.js backend/tests/questionBank/normalize.test.js
git commit -m "feat: add skill name normalization and alias index"
```

---

## Task 3: Generate the registry seed file

**Files:**
- Create: `backend/scripts/generateSkillSeed.js`
- Create: `backend/src/services/questionBank/skills/seedData.json` (generated output, committed)

**Interfaces:**
- Consumes: `normalizeToken`, `buildAliasIndex` from Task 2
- Produces: `seedData.json` — an array of `{ canonicalName, slug, aliases, category, tier, targetQuestionCount }`. Consumed by Task 5.

**Why a generator rather than a hand-written list:** `frontend/src/constants/skills.js` holds ~180 entries with display casing and a `technical`/`non-technical` flag. Transcribing them by hand into the backend would introduce errors and drift. The frontend file is ESM and the backend is CommonJS in a separate npm project, so it cannot be `require`d — hence a parse step. This script runs **once**; its output is committed and reviewed, and afterwards the database is the source of truth.

- [ ] **Step 1: Write the generator**

Create `backend/scripts/generateSkillSeed.js`:

```js
// ONE-TIME importer: parses frontend ALL_SKILLS into a committed seed file.
// Run:  node scripts/generateSkillSeed.js
//
// The frontend list is ESM in a separate npm project, so it is parsed as text
// rather than imported. After the registry is seeded, the database is the
// source of truth and this script should not need to run again.

const fs = require('fs');
const path = require('path');
const { normalizeToken, buildAliasIndex } = require('../src/services/questionBank/skills/normalize');

const FRONTEND_SKILLS = path.join(__dirname, '../../frontend/src/constants/skills.js');
const OUTPUT = path.join(__dirname, '../src/services/questionBank/skills/seedData.json');

// Popularity tiers drive generation order. Everything unlisted defaults to 3.
const TIER_1 = [
  'Python', 'Java', 'JavaScript', 'React', 'Node.js',
  'SQL', 'Git and GitHub', 'Docker', 'AWS',
];
const TIER_2 = [
  'Redis', 'MongoDB', 'Linux', 'TypeScript', 'Express js', 'Next.js', 'Kubernetes',
];
const TIER_3_EXPLICIT = [
  'Rust', 'Terraform', 'Kafka', 'ElasticSearch', 'Go', 'GraphQL',
];

// Canonical name -> spellings that must fold into it. These are SEMANTIC merges
// that no string rule could infer; punctuation variants are handled by
// normalizeToken and must NOT be listed here.
const MERGES = {
  'Matplotlib & Seaborn': ['Matplotlib', 'Seaborn'],
  'Data Structures & Algorithms': ['Data Structure'],
  'Agile Methodologies': ['Agile Principles & Scrum'],
  'Generative AI': ['GenAI'],
};

// Tier-listed skills absent from the frontend list must still get registry rows.
const EXTRA_SKILLS = ['Redis', 'GraphQL'];

function parseFrontendSkills(source) {
  const entries = [];
  const re = /\{\s*skill:\s*"((?:[^"\\]|\\.)*)"\s*,\s*type:\s*"(technical|non-technical)"\s*\}/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    entries.push({ skill: match[1].replace(/\\"/g, '"'), type: match[2] });
  }
  return entries;
}

function slugify(canonicalName) {
  return normalizeToken(canonicalName)
    .replace(/\+/g, '-plus')
    .replace(/#/g, '-sharp')
    .replace(/\s+/g, '-');
}

function tierFor(canonicalName) {
  if (TIER_1.includes(canonicalName)) return 1;
  if (TIER_2.includes(canonicalName)) return 2;
  return 3;
}

function main() {
  const source = fs.readFileSync(FRONTEND_SKILLS, 'utf8');
  const parsed = parseFrontendSkills(source);

  if (parsed.length === 0) {
    throw new Error('Parsed zero skills from the frontend list — the file format changed.');
  }

  const technical = parsed.filter((e) => e.type === 'technical').map((e) => e.skill);
  const names = [...new Set([...technical, ...EXTRA_SKILLS])];

  // Names that are merged INTO another canonical must not become rows themselves.
  const absorbed = new Set(Object.values(MERGES).flat().map(normalizeToken));

  const definitions = names
    .filter((name) => !absorbed.has(normalizeToken(name)))
    .map((canonicalName) => ({
      canonicalName,
      slug: slugify(canonicalName),
      aliases: MERGES[canonicalName] || [],
      category: 'technical',
      tier: tierFor(canonicalName),
      targetQuestionCount: 300,
    }))
    .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));

  // Fail loudly on duplicate slugs or alias collisions before writing anything.
  const slugs = new Set();
  for (const def of definitions) {
    if (slugs.has(def.slug)) {
      throw new Error(`Duplicate slug "${def.slug}" for "${def.canonicalName}"`);
    }
    slugs.add(def.slug);
  }
  buildAliasIndex(definitions); // throws on collision

  fs.writeFileSync(OUTPUT, JSON.stringify(definitions, null, 2) + '\n');

  const byTier = definitions.reduce((acc, d) => {
    acc[d.tier] = (acc[d.tier] || 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${definitions.length} skill definitions to ${OUTPUT}`);
  console.log(`  Tier 1: ${byTier[1] || 0}  Tier 2: ${byTier[2] || 0}  Tier 3: ${byTier[3] || 0}`);
  console.log(`  Merged away: ${[...absorbed].join(', ')}`);
}

main();
```

- [ ] **Step 2: Run the generator**

Run: `cd backend && node scripts/generateSkillSeed.js`
Expected: prints a total count (roughly 145–155), a tier breakdown with Tier 1 = 9 and Tier 2 = 7, and the merged-away list containing `matplotlib`, `seaborn`, `data structure`, `agile principles & scrum`, `genai`.

If it throws a collision or duplicate-slug error, fix `MERGES` — do not weaken the guard.

- [ ] **Step 3: Verify the output by inspection**

Run:
```bash
cd backend && node -e "
const d=require('./src/services/questionBank/skills/seedData.json');
console.log('total', d.length);
console.log('tier1', d.filter(x=>x.tier===1).map(x=>x.canonicalName));
console.log('merged', d.filter(x=>x.aliases.length).map(x=>x.canonicalName+' <- '+x.aliases.join(',')));
console.log('c-family', d.filter(x=>['c','c++','c#'].includes(x.canonicalName.toLowerCase())).map(x=>x.canonicalName+'='+x.slug));
"
```
Expected: `tier1` lists exactly the 9 Tier 1 skills. `merged` shows the 4 merge groups. `c-family` shows three distinct rows: `C=c`, `C++=c-plus-plus`, `C#=c-sharp`. If `C++` or `C#` is missing, normalization has wrongly collapsed them — stop and fix Task 2.

- [ ] **Step 4: Commit**

```bash
git add backend/scripts/generateSkillSeed.js backend/src/services/questionBank/skills/seedData.json
git commit -m "feat: generate canonical skill registry seed from frontend list"
```

---

## Task 4: SkillDefinition model and repository

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/services/questionBank/repositories/skillDefinitionRepository.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `findAll() → Promise<SkillDefinition[]>` (excludes soft-deleted)
  - `findBySlug(slug) → Promise<SkillDefinition|null>`
  - `upsertMany(definitions) → Promise<{created: number, updated: number}>`
  - `countAll() → Promise<number>`

**Reminder:** the model is `SkillDefinition`. `Skill` is already an embedded type on `Profile`.

- [ ] **Step 1: Add the model to the schema**

Append to `backend/prisma/schema.prisma`:

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

Status values are `WAITING | GENERATING | PAUSED | REVIEWING | COMPLETED | PUBLISHED`, stored as plain strings to match the existing convention (`User.role` is a plain string, not an enum).

- [ ] **Step 2: Regenerate the Prisma client and verify no name collision**

Run: `cd backend && npx prisma generate`
Expected: `Generated Prisma Client`. If it errors with a duplicate declaration mentioning `Skill`, the model was named wrongly — it must be `SkillDefinition`.

- [ ] **Step 3: Write the repository**

Create `backend/src/services/questionBank/repositories/skillDefinitionRepository.js`:

```js
// Sole Prisma access point for SkillDefinition. Nothing else under
// services/questionBank/ may import the Prisma client directly.
const prisma = require('../../../config/db');

async function findAll() {
  return prisma.skillDefinition.findMany({
    where: { deletedAt: null },
    orderBy: { canonicalName: 'asc' },
  });
}

async function findBySlug(slug) {
  return prisma.skillDefinition.findUnique({ where: { slug } });
}

async function countAll() {
  return prisma.skillDefinition.count();
}

// Idempotent: safe to re-run seeding without duplicating rows.
// Does not overwrite `status` or `counters` — those are live state owned by
// the generation pipeline, not by the seed file.
async function upsertMany(definitions) {
  let created = 0;
  let updated = 0;

  for (const def of definitions) {
    const existing = await prisma.skillDefinition.findUnique({
      where: { slug: def.slug },
    });

    if (existing) {
      await prisma.skillDefinition.update({
        where: { slug: def.slug },
        data: {
          canonicalName: def.canonicalName,
          aliases: def.aliases,
          category: def.category,
          tier: def.tier,
          targetQuestionCount: def.targetQuestionCount,
        },
      });
      updated += 1;
    } else {
      await prisma.skillDefinition.create({
        data: {
          canonicalName: def.canonicalName,
          slug: def.slug,
          aliases: def.aliases,
          category: def.category,
          tier: def.tier,
          targetQuestionCount: def.targetQuestionCount,
          status: 'WAITING',
        },
      });
      created += 1;
    }
  }

  return { created, updated };
}

module.exports = { findAll, findBySlug, countAll, upsertMany };
```

- [ ] **Step 4: Verify the module loads**

Run: `cd backend && node -e "const r=require('./src/services/questionBank/repositories/skillDefinitionRepository'); console.log(Object.keys(r))"`
Expected: `[ 'findAll', 'findBySlug', 'countAll', 'upsertMany' ]`

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/src/services/questionBank/repositories/skillDefinitionRepository.js
git commit -m "feat: add SkillDefinition model and repository"
```

---

## Task 5: Seed CLI command

**Files:**
- Create: `backend/src/cli/bank.js`
- Create: `backend/src/cli/commands/seedSkills.js`
- Modify: `backend/package.json`

**Interfaces:**
- Consumes: `skillDefinitionRepository.upsertMany`, `buildAliasIndex`, `seedData.json`
- Produces: `npm run bank -- seed-skills [--commit]`. Later plans add subcommands to the same dispatcher.

- [ ] **Step 1: Write the CLI entry point**

Create `backend/src/cli/bank.js`:

```js
#!/usr/bin/env node
// Question bank operator CLI.
//   npm run bank -- <command> [flags]
//
// Every command that writes defaults to dry-run; use --commit to persist.

require('dotenv').config();

const COMMANDS = {
  'seed-skills': () => require('./commands/seedSkills'),
  'normalize-skills': () => require('./commands/normalizeSkillNames'),
};

function usage() {
  console.log('Usage: npm run bank -- <command> [--commit]');
  console.log('');
  console.log('Commands:');
  console.log('  seed-skills        Seed SkillDefinition rows from seedData.json');
  console.log('  normalize-skills   Rewrite existing skill names to canonical form');
  console.log('');
  console.log('Flags:');
  console.log('  --commit           Persist changes (default is dry-run)');
}

async function main() {
  const [, , commandName, ...args] = process.argv;

  if (!commandName || commandName === '--help' || commandName === '-h') {
    usage();
    process.exit(0);
  }

  const loader = COMMANDS[commandName];
  if (!loader) {
    console.error(`Unknown command: ${commandName}`);
    usage();
    process.exit(1);
  }

  const command = loader();
  const commit = args.includes('--commit');

  try {
    await command.run({ commit });
    process.exit(0);
  } catch (err) {
    console.error(`\n${commandName} failed:`, err.message);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 2: Write the seed command**

Create `backend/src/cli/commands/seedSkills.js`:

```js
const seedData = require('../../services/questionBank/skills/seedData.json');
const { buildAliasIndex } = require('../../services/questionBank/skills/normalize');
const repo = require('../../services/questionBank/repositories/skillDefinitionRepository');

async function run({ commit }) {
  // Validate before touching the database. A collision here means bad seed data.
  const index = buildAliasIndex(seedData);

  const byTier = seedData.reduce((acc, d) => {
    acc[d.tier] = (acc[d.tier] || 0) + 1;
    return acc;
  }, {});

  console.log(`Seed file: ${seedData.length} definitions`);
  console.log(`  Tier 1: ${byTier[1] || 0}  Tier 2: ${byTier[2] || 0}  Tier 3: ${byTier[3] || 0}`);
  console.log(`  Alias index: ${index.size} recognised spellings`);

  const existingCount = await repo.countAll();
  console.log(`  Existing rows in database: ${existingCount}`);

  if (!commit) {
    console.log('\nDRY RUN — no changes written. Re-run with --commit to persist.');
    return;
  }

  const { created, updated } = await repo.upsertMany(seedData);
  console.log(`\nCommitted: ${created} created, ${updated} updated.`);
}

module.exports = { run };
```

- [ ] **Step 3: Add the npm script**

In `backend/package.json`, add to `scripts`:

```json
"bank": "node src/cli/bank.js"
```

- [ ] **Step 4: Run the dry run**

Run: `cd backend && npm run bank -- seed-skills`
Expected: prints the definition count, tier breakdown, alias index size, existing row count, and ends with `DRY RUN — no changes written.` No database writes occur.

- [ ] **Step 5: Verify help output works**

Run: `cd backend && npm run bank -- --help`
Expected: usage text listing `seed-skills` and `normalize-skills`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/cli/bank.js backend/src/cli/commands/seedSkills.js backend/package.json
git commit -m "feat: add bank CLI with seed-skills command"
```

---

## Task 6: Registry cache and skill matching integration

**Files:**
- Create: `backend/src/services/questionBank/skills/registryCache.js`
- Modify: `backend/src/services/skillMatching.service.js`
- Test: `backend/tests/questionBank/registryCache.test.js`

**Interfaces:**
- Consumes: `skillDefinitionRepository.findAll`, `buildAliasIndex`, `resolveSkill`
- Produces:
  - `load() → Promise<void>` — populates the cache from the database
  - `resolve(rawName) → string | null` — canonical name, using the cached index
  - `isLoaded() → boolean`
  - `_setForTesting(definitions)` — injects definitions without a database

**Why a cache:** `skillMatching.service.js` runs on every job match. A database round trip per skill comparison would be a significant regression. The registry changes only when an operator seeds it, so a boot-time load with an explicit reload is sufficient.

**Behaviour when the cache is empty:** `resolve()` must fall back to returning the input unchanged rather than `null`. Returning `null` would make every match fail if the registry has not been seeded yet — a silent, total outage of job matching. Degrading to current behaviour is the safe failure mode.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/questionBank/registryCache.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const cache = require('../../src/services/questionBank/skills/registryCache');

test('resolve returns input unchanged when cache is not loaded', () => {
  cache._setForTesting(null);
  assert.strictEqual(cache.isLoaded(), false);
  assert.strictEqual(cache.resolve('next js'), 'next js');
});

test('resolve maps aliases to canonical names once loaded', () => {
  cache._setForTesting([
    { canonicalName: 'Next.js', aliases: ['Next js'] },
    { canonicalName: 'Generative AI', aliases: ['GenAI'] },
  ]);
  assert.strictEqual(cache.isLoaded(), true);
  assert.strictEqual(cache.resolve('next js'), 'Next.js');
  assert.strictEqual(cache.resolve('NEXT.JS'), 'Next.js');
  assert.strictEqual(cache.resolve('genai'), 'Generative AI');
});

test('resolve returns input unchanged for unknown skills', () => {
  cache._setForTesting([{ canonicalName: 'Python' }]);
  assert.strictEqual(cache.resolve('Cobol'), 'Cobol');
});

test('resolve handles empty and non-string input safely', () => {
  cache._setForTesting([{ canonicalName: 'Python' }]);
  assert.strictEqual(cache.resolve(''), '');
  assert.strictEqual(cache.resolve(null), null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npm test`
Expected: FAIL with `Cannot find module '../../src/services/questionBank/skills/registryCache'`

- [ ] **Step 3: Write the cache**

Create `backend/src/services/questionBank/skills/registryCache.js`:

```js
// Boot-time cached alias index for the hot job-matching path.
//
// The registry only changes when an operator seeds it, so a single load at
// startup (with an explicit reload) avoids a database round trip per skill
// comparison in skillMatching.service.js.
//
// FAILURE MODE: if the cache is not loaded, resolve() returns the input
// unchanged rather than null. An unseeded registry must degrade to today's
// behaviour, not silently fail every job match.

const repo = require('../repositories/skillDefinitionRepository');
const { buildAliasIndex, resolveSkill } = require('./normalize');

let aliasIndex = null;

async function load() {
  const definitions = await repo.findAll();
  aliasIndex = buildAliasIndex(definitions);
  console.log(`[skill-registry] loaded ${aliasIndex.size} skill spellings`);
}

function isLoaded() {
  return aliasIndex !== null;
}

function resolve(rawName) {
  if (!aliasIndex) return rawName;
  return resolveSkill(aliasIndex, rawName) || rawName;
}

// Test seam: populate the index without a database.
function _setForTesting(definitions) {
  aliasIndex = definitions === null ? null : buildAliasIndex(definitions);
}

module.exports = { load, isLoaded, resolve, _setForTesting };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npm test`
Expected: PASS, `# fail 0`.

- [ ] **Step 5: Rewrite the matching service to resolve both sides**

The service builds a lowercase-keyed map of student skills and looks requirements up in it. Resolution must happen on **both** the map keys and the lookup key — resolving only one side would make a canonical name fail to match its own alias.

Replace the entire contents of `backend/src/services/skillMatching.service.js` with:

```js
const { TECHNICAL_SKILLS } = require('../constants/technicalSkills');
const registryCache = require('./questionBank/skills/registryCache');

// Both the map keys and the lookup key are resolved through the registry, so a
// profile storing "next js" still matches a requirement storing "Next.js".
// When the registry is unloaded, resolve() returns its input unchanged and this
// behaves exactly as it did before.

// Builds a case-insensitive lookup of a candidate's self-rated skills:
//   { "react": 8, "css": 6, ... }
function buildStudentSkillMap(profile) {
  const studentSkills = {};
  if (profile && profile.skills) {
    profile.skills.forEach(s => {
      studentSkills[registryCache.resolve(s.name).toLowerCase()] = s.rating;
    });
  }
  return studentSkills;
}

// Returns the list of technical requirements the candidate falls short on.
// Only technical skills (present in TECHNICAL_SKILLS) gate an application;
// non-technical requirements are ignored, matching the original controller logic.
function getMissingRequirements(job, studentSkills) {
  const missingRequirements = [];
  if (job && job.requirements) {
    job.requirements.forEach(reqSkill => {
      const canonical = registryCache.resolve(reqSkill.skillName).toLowerCase();
      const isTech = TECHNICAL_SKILLS.has(canonical);
      if (isTech) {
        const studentRating = studentSkills[canonical] || 0;
        if (studentRating < reqSkill.minRating) {
          missingRequirements.push({
            skillName: reqSkill.skillName,
            requiredRating: reqSkill.minRating,
            currentRating: studentRating
          });
        }
      }
    });
  }
  return missingRequirements;
}

module.exports = { buildStudentSkillMap, getMissingRequirements };
```

Note that `missingRequirements` still reports the **original** `reqSkill.skillName`, not the canonical one — the recruiter's own wording is what should appear in the UI. Do not change the eligibility rules, the `minRating` comparison, or the returned shape.

- [ ] **Step 6: Note the TECHNICAL_SKILLS gap**

`TECHNICAL_SKILLS` still gates which requirements count. Two Tier-listed skills (`Redis`, `GraphQL`) are absent from that set, so a requirement naming them would be silently treated as non-technical and ignored. No current job can require them (they are absent from the frontend list too), so this is latent rather than live.

Add this comment above the `TECHNICAL_SKILLS` import in the file you just wrote:

```js
// TODO(question-bank Plan 5): TECHNICAL_SKILLS should be derived from the
// SkillDefinition registry rather than a hand-maintained set. Until then,
// registry skills missing from this set (e.g. Redis, GraphQL) will not gate
// applications. Tracked in docs/superpowers/specs/2026-07-18-question-bank-spine-design.md
```

- [ ] **Step 7: Load the cache at server startup**

In `backend/src/index.js`, after the database connection is established and before the server starts listening, add:

```js
const skillRegistry = require('./services/questionBank/skills/registryCache');

// Non-fatal: an unseeded registry degrades to raw name matching.
skillRegistry.load().catch((err) => {
  console.warn('[skill-registry] load failed, falling back to raw name matching:', err.message);
});
```

- [ ] **Step 8: Verify the server still boots**

Run: `cd backend && npm run dev`
Expected: server starts on port 5001. Log shows either `[skill-registry] loaded N skill spellings` or the warning fallback. Neither is fatal. Stop the server with Ctrl-C.

- [ ] **Step 9: Run the full test suite**

Run: `cd backend && npm test`
Expected: PASS, `# fail 0`.

- [ ] **Step 10: Commit**

```bash
git add backend/src/services/questionBank/skills/registryCache.js backend/tests/questionBank/registryCache.test.js backend/src/services/skillMatching.service.js backend/src/index.js
git commit -m "feat: resolve skill names through registry cache in matching"
```

---

## Task 7: Normalize existing skill names in live data

**Files:**
- Create: `backend/src/cli/commands/normalizeSkillNames.js`

**Interfaces:**
- Consumes: `skillDefinitionRepository.findAll`, `buildAliasIndex`, `resolveSkill`
- Produces: `npm run bank -- normalize-skills [--commit]`

**This is the highest-risk task in the plan.** It rewrites live user data. Every stored `"next js"` in `Profile.skills[].name` and every `"Next js"` in `Job.requirements[].skillName` becomes `"Next.js"`. If it goes wrong, candidate profiles and job requirements are corrupted.

Requirements that are not optional:
- Dry-run by default; `--commit` required to write.
- Print every proposed change before writing, grouped by from→to.
- Write a JSON rollback file recording each document's original array before mutation.
- Never touch a skill name that does not resolve to a different canonical name.
- Preserve `rating` and `verifiedRating` exactly — only `name` changes.

- [ ] **Step 1: Write the migration command**

Create `backend/src/cli/commands/normalizeSkillNames.js`:

```js
const fs = require('fs');
const path = require('path');
const prisma = require('../../config/db');
const repo = require('../../services/questionBank/repositories/skillDefinitionRepository');
const { buildAliasIndex, resolveSkill } = require('../../services/questionBank/skills/normalize');

const ROLLBACK_DIR = path.join(__dirname, '../../../.rollback');

// Returns the canonical name only when it differs from what is stored.
function canonicalChange(index, storedName) {
  const canonical = resolveSkill(index, storedName);
  if (!canonical) return null;
  if (canonical === storedName) return null;
  return canonical;
}

async function planProfiles(index) {
  // NOTE: Profile has no `deletedAt` field — do not add a soft-delete filter here,
  // Prisma will reject it with "Unknown argument deletedAt".
  const profiles = await prisma.profile.findMany({
    select: { id: true, name: true, skills: true },
  });

  const changes = [];
  for (const profile of profiles) {
    const skills = profile.skills || [];
    const updated = skills.map((s) => {
      const canonical = canonicalChange(index, s.name);
      return canonical ? { ...s, name: canonical } : s;
    });

    const touched = updated.some((s, i) => s.name !== skills[i].name);
    if (touched) {
      changes.push({ id: profile.id, label: profile.name, before: skills, after: updated });
    }
  }
  return changes;
}

async function planJobs(index) {
  const jobs = await prisma.job.findMany({
    select: { id: true, title: true, requirements: true },
  });

  const changes = [];
  for (const job of jobs) {
    const reqs = job.requirements || [];
    const updated = reqs.map((r) => {
      const canonical = canonicalChange(index, r.skillName);
      return canonical ? { ...r, skillName: canonical } : r;
    });

    const touched = updated.some((r, i) => r.skillName !== reqs[i].skillName);
    if (touched) {
      changes.push({ id: job.id, label: job.title, before: reqs, after: updated });
    }
  }
  return changes;
}

function summarise(changes, nameKey) {
  const tally = new Map();
  for (const change of changes) {
    change.before.forEach((item, i) => {
      const from = item[nameKey];
      const to = change.after[i][nameKey];
      if (from === to) return;
      const key = `${from}  ->  ${to}`;
      tally.set(key, (tally.get(key) || 0) + 1);
    });
  }
  return tally;
}

function printTally(title, tally) {
  console.log(`\n${title}`);
  if (tally.size === 0) {
    console.log('  (no changes)');
    return;
  }
  for (const [key, count] of [...tally.entries()].sort()) {
    console.log(`  ${key}   (${count})`);
  }
}

function writeRollback(profileChanges, jobChanges) {
  if (!fs.existsSync(ROLLBACK_DIR)) {
    fs.mkdirSync(ROLLBACK_DIR, { recursive: true });
  }
  const file = path.join(ROLLBACK_DIR, `normalize-skills-${Date.now()}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        profiles: profileChanges.map((c) => ({ id: c.id, skills: c.before })),
        jobs: jobChanges.map((c) => ({ id: c.id, requirements: c.before })),
      },
      null,
      2
    )
  );
  return file;
}

async function run({ commit }) {
  const definitions = await repo.findAll();
  if (definitions.length === 0) {
    throw new Error('Registry is empty. Run `npm run bank -- seed-skills --commit` first.');
  }

  const index = buildAliasIndex(definitions);
  console.log(`Registry: ${definitions.length} definitions, ${index.size} recognised spellings`);

  const profileChanges = await planProfiles(index);
  const jobChanges = await planJobs(index);

  printTally(`Profiles to update: ${profileChanges.length}`, summarise(profileChanges, 'name'));
  printTally(`Jobs to update: ${jobChanges.length}`, summarise(jobChanges, 'skillName'));

  if (profileChanges.length === 0 && jobChanges.length === 0) {
    console.log('\nNothing to normalize.');
    return;
  }

  if (!commit) {
    console.log('\nDRY RUN — no changes written. Re-run with --commit to persist.');
    return;
  }

  const rollbackFile = writeRollback(profileChanges, jobChanges);
  console.log(`\nRollback snapshot written to ${rollbackFile}`);

  for (const change of profileChanges) {
    await prisma.profile.update({
      where: { id: change.id },
      data: { skills: change.after },
    });
  }
  for (const change of jobChanges) {
    await prisma.job.update({
      where: { id: change.id },
      data: { requirements: change.after },
    });
  }

  console.log(`Committed: ${profileChanges.length} profiles, ${jobChanges.length} jobs updated.`);
}

module.exports = { run };
```

- [ ] **Step 2: Verify it refuses to run against an empty registry**

Run: `cd backend && npm run bank -- normalize-skills`
Expected (if the registry has not been seeded): fails with `Registry is empty. Run \`npm run bank -- seed-skills --commit\` first.` and exit code 1.

- [ ] **Step 3: Seed the registry, then dry-run the migration**

```bash
cd backend
npm run bank -- seed-skills --commit
npm run bank -- normalize-skills
```
Expected: prints the registry size, then a from→to tally for profiles and jobs, ending with `DRY RUN — no changes written.`

**Inspect the tally before proceeding.** Every line must be a rename you intend — for example `next js -> Next.js`, `GenAI -> Generative AI`. If any line renames a skill to something unrelated, stop and fix `MERGES` in Task 3 rather than proceeding.

- [ ] **Step 4: Back up the database, then commit the migration**

Take a database backup by whatever mechanism this deployment uses (for MongoDB Atlas, a manual snapshot; for a local instance, `mongodump`). Then:

Run: `cd backend && npm run bank -- normalize-skills --commit`
Expected: prints the rollback file path under `backend/.rollback/`, then `Committed: N profiles, M jobs updated.`

- [ ] **Step 5: Verify the migration is idempotent**

Run: `cd backend && npm run bank -- normalize-skills`
Expected: `Nothing to normalize.` Re-running must find zero remaining changes. If it still reports changes, the resolution logic is unstable — investigate before continuing.

- [ ] **Step 6: Ignore the rollback directory in git**

Append to `backend/.gitignore`:

```
.rollback/
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/cli/commands/normalizeSkillNames.js backend/.gitignore
git commit -m "feat: add reversible skill name normalization migration"
```

---

## Task 8: Mock database support and documentation

**Files:**
- Modify: `backend/src/config/mock/mockClient.js`
- Modify: `MEMORY.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: nothing
- Produces: `prisma.skillDefinition.*` works in offline mock mode.

**Why:** `mockClient.js` hand-implements each Prisma query shape the controllers use. Without `skillDefinition` support, `registryCache.load()` throws in offline mode. The warning fallback in Task 6 keeps this non-fatal, but the boot log would be noisy and the registry unavailable offline.

- [ ] **Step 1: Add the backing array to the mock store**

`mockClient.js` reads its data from `mockDb` (defined in `backend/src/config/mock/seed.js`). Add an empty collection there alongside the existing ones:

```js
skillDefinitions: [],
```

The registry is populated by the CLI against a real database. Offline mode legitimately starts empty and degrades to raw name matching via the Task 6 fallback.

- [ ] **Step 2: Add the skillDefinition model to the mock client**

The existing models follow a consistent shape — each is a key on the exported object whose methods are `async ({ where, data })` functions operating on a `mockDb` array (see `profile` at line 24 and `job` at line 111). Follow it exactly.

Add to the exported object in `backend/src/config/mock/mockClient.js`:

```js
  skillDefinition: {
    findMany: async (args = {}) => {
      let rows = mockDb.skillDefinitions.filter(s => !s.deletedAt);
      if (args.orderBy && args.orderBy.canonicalName) {
        const dir = args.orderBy.canonicalName === 'desc' ? -1 : 1;
        rows = [...rows].sort((a, b) => a.canonicalName.localeCompare(b.canonicalName) * dir);
      }
      return rows;
    },
    findUnique: async ({ where }) => {
      const field = Object.keys(where)[0];
      return mockDb.skillDefinitions.find(s => s[field] === where[field]) || null;
    },
    count: async () => mockDb.skillDefinitions.length,
    create: async ({ data }) => {
      const row = {
        id: `sd_${Date.now()}_${mockDb.skillDefinitions.length}`,
        status: 'WAITING',
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        ...data,
      };
      mockDb.skillDefinitions.push(row);
      return row;
    },
    update: async ({ where, data }) => {
      const idx = mockDb.skillDefinitions.findIndex(
        s => s.slug === where.slug || s.id === where.id
      );
      if (idx === -1) return null;
      mockDb.skillDefinitions[idx] = {
        ...mockDb.skillDefinitions[idx],
        ...data,
        updatedAt: new Date(),
      };
      return mockDb.skillDefinitions[idx];
    },
  },
```

The generated id suffixes the array length because `Date.now()` alone collides when seeding ~150 rows inside a single millisecond.

- [ ] **Step 3: Verify offline boot is clean**

Run: `cd backend && DATABASE_URL= npm run dev`
Expected: server boots on port 5001 using the mock client. Log shows `[skill-registry] loaded 0 skill spellings` rather than an error. Stop with Ctrl-C.

- [ ] **Step 4: Update MEMORY.md**

Make these edits to `MEMORY.md`:

1. **Remove the phantom root `package.json`** from the folder-structure tree (there is no root `package.json`; `CLAUDE.md` is correct).
2. **Add to the backend folder tree**, under `src/`:
   ```
   │   │   ├── cli/                  # Operator CLI entry point and subcommands
   │   │   │   ├── bank.js           # `npm run bank -- <command>` dispatcher
   │   │   │   └── commands/
   │   │   │       ├── seedSkills.js # Seeds SkillDefinition rows from seedData.json
   │   │   │       └── normalizeSkillNames.js # Reversible canonical-name migration
   │   │   ├── services/questionBank/
   │   │   │   ├── repositories/     # Sole Prisma access for question bank models
   │   │   │   └── skills/           # Normalization, alias index, registry cache
   ```
3. **Add a file-responsibility entry** for `SkillDefinition` in the schema section, noting it is the canonical registry for skill identity, tier, and publish status, and that it is named `SkillDefinition` because `Skill` is already an embedded type on `Profile`.
4. **Add a note** that `backend/src/constants/technicalSkills.js` and `frontend/src/constants/skills.js` are now **legacy**: the database registry is the source of truth after seeding.

- [ ] **Step 5: Fix the incorrect threshold claim in CLAUDE.md**

In `CLAUDE.md`, the "Skill matching & verification" section states that `submitSkillTest` has a pass threshold of `score >= 7`. No such threshold exists in the code. Replace that claim with:

```
- `submitSkillTest` (MCQ flow) currently applies **no pass threshold** — `passed` is hardcoded `true`
  and `score` is taken from the request body. This is a known vulnerability being fixed in Plan 2 of
  the question bank work (see `docs/superpowers/specs/2026-07-18-question-bank-spine-design.md` §3).
```

- [ ] **Step 6: Run the full test suite**

Run: `cd backend && npm test`
Expected: PASS, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/config/mock/mockClient.js MEMORY.md CLAUDE.md
git commit -m "feat: add skillDefinition mock support; correct MEMORY.md and CLAUDE.md"
```

---

## Definition of Done

- [ ] `cd backend && npm test` passes with zero failures
- [ ] `npm run bank -- seed-skills` dry-runs cleanly and reports Tier 1 = 9, Tier 2 = 7
- [ ] `npm run bank -- normalize-skills` reports `Nothing to normalize.` on a second run (idempotent)
- [ ] `C`, `C++`, and `C#` exist as three distinct registry rows
- [ ] The four merge groups resolve to single canonical names
- [ ] Server boots both with a real `DATABASE_URL` and with it unset
- [ ] A rollback snapshot exists under `backend/.rollback/` for the committed migration
- [ ] `MEMORY.md` no longer lists a root `package.json`
- [ ] `CLAUDE.md` no longer claims a pass threshold that does not exist

## Follow-on Plans

| Plan | Contents | Blocked by |
|---|---|---|
| 2 | `TestSession` model, server-side scoring, answer-key stripping — **fixes both §3 security findings** | Nothing in this plan; independently shippable |
| 3 | `SkillBlueprint` + `TopicProgress` models, AI blueprint drafting, CLI approval gate | Plan 1 |
| 4 | `Question` + `GenerationJob` + `QuestionReviewFlag`, worker process, generation pipeline | Plans 1, 3 |
| 5 | Assessment read path, selection blueprint, fallback flag | Plans 1, 2, 4 |
