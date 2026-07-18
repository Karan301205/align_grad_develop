// Tests for skillDefinitionRepository's upsertMany — the only function in
// this module with real branching logic. findAll/findBySlug/countAll are
// thin one-line Prisma delegations and are intentionally not covered here.
//
// Safety note (read before touching this file):
// skillDefinitionRepository.js does
//   const { prisma } = require('../../../config/db');
// at module load time. backend/.env's DATABASE_URL points at a live
// production MongoDB Atlas cluster (see CLAUDE.md), and db.js
// unconditionally fires an unawaited `prismaInstance.user.count()`
// connectivity probe against it the moment it is required — regardless of
// whether upsertMany's injected `client` param is ever used. To guarantee
// these tests can never reach that cluster, we pre-populate require.cache
// for config/db with a harmless stub *before* requiring the repository, so
// db.js's real body never executes. Every test below then passes its own
// hand-written fake client explicitly to upsertMany, exercising the real
// repository logic (branch selection, payload shape) against an in-memory
// store instead of Prisma/Mongo.
const test = require('node:test');
const assert = require('node:assert');

const dbModulePath = require.resolve('../../src/config/db');
require.cache[dbModulePath] = {
  id: dbModulePath,
  filename: dbModulePath,
  loaded: true,
  exports: {
    // Deliberately inert: any call made through this would throw. That's
    // the point — real calls made by upsertMany must go through the
    // injected `client` param in tests, never this module-level binding.
    prisma: {},
    isMock: () => true,
  },
};

const {
  upsertMany,
} = require('../../src/services/questionBank/repositories/skillDefinitionRepository');

// -- Hand-written fake Prisma client -----------------------------------
// Mirrors just the surface upsertMany uses: findUnique/create/update on
// skillDefinition. `store` is a Map keyed by slug that persists across
// calls made against the same client instance, so a single client can be
// reused to exercise idempotency (run the same batch twice; the second run
// must update instead of recreate).
function createFakeClient(seedRows = []) {
  const store = new Map(seedRows.map((row) => [row.slug, { ...row }]));
  const calls = { findUnique: [], create: [], update: [] };

  return {
    store,
    calls,
    skillDefinition: {
      async findUnique({ where: { slug } }) {
        calls.findUnique.push({ where: { slug } });
        const row = store.get(slug);
        return row ? { ...row } : null;
      },
      async create({ data }) {
        calls.create.push({ data: { ...data } });
        store.set(data.slug, { ...data });
        return { ...data };
      },
      async update({ where: { slug }, data }) {
        calls.update.push({ where: { slug }, data: { ...data } });
        const existing = store.get(slug) || {};
        const merged = { ...existing, ...data };
        store.set(slug, merged);
        return { ...merged };
      },
    },
  };
}

function makeDefinition(overrides = {}) {
  return {
    canonicalName: 'Python',
    slug: 'python',
    aliases: ['py'],
    category: 'technical',
    tier: 2,
    targetQuestionCount: 300,
    ...overrides,
  };
}

test('upsertMany creates a new row for a slug that does not exist yet', async () => {
  const client = createFakeClient();
  const def = makeDefinition({ slug: 'rust', canonicalName: 'Rust' });

  const result = await upsertMany([def], client);

  assert.strictEqual(client.calls.create.length, 1, 'create should be called once');
  assert.strictEqual(client.calls.update.length, 0, 'update should not be called');
  assert.strictEqual(client.calls.create[0].data.status, 'WAITING');
  assert.strictEqual(result.created, 1);
  assert.strictEqual(result.updated, 0);
});

test('upsertMany updates an existing row without overwriting status or counters', async () => {
  const client = createFakeClient([
    {
      slug: 'python',
      canonicalName: 'Python',
      aliases: ['py'],
      category: 'technical',
      tier: 2,
      targetQuestionCount: 300,
      status: 'READY',
      counters: {
        totalQuestions: 250,
        validated: 200,
        topicsReady: 5,
        topicsTotal: 6,
      },
    },
  ]);
  const def = makeDefinition({ slug: 'python', canonicalName: 'Python 3', tier: 1 });

  const result = await upsertMany([def], client);

  assert.strictEqual(client.calls.update.length, 1, 'update should be called once');
  assert.strictEqual(client.calls.create.length, 0, 'create should not be called');

  const updateData = client.calls.update[0].data;
  // Load-bearing assertion: status and counters are live state owned by the
  // generation pipeline. The seed file must never be able to clobber them,
  // today or after any future refactor of upsertMany's internals (e.g.
  // collapsing to a single prisma.skillDefinition.upsert() call).
  assert.ok(!('status' in updateData), 'update payload must not include status');
  assert.ok(!('counters' in updateData), 'update payload must not include counters');

  // Sanity: the fields that should change were actually sent.
  assert.strictEqual(updateData.canonicalName, 'Python 3');
  assert.strictEqual(updateData.tier, 1);

  assert.strictEqual(result.created, 0);
  assert.strictEqual(result.updated, 1);
});

test('upsertMany returns accurate created/updated counts for a mixed batch', async () => {
  const client = createFakeClient([
    {
      slug: 'python',
      canonicalName: 'Python',
      aliases: [],
      category: 'technical',
      tier: 2,
      targetQuestionCount: 300,
      status: 'READY',
    },
    {
      slug: 'sql',
      canonicalName: 'SQL',
      aliases: [],
      category: 'technical',
      tier: 3,
      targetQuestionCount: 300,
      status: 'READY',
    },
  ]);
  const defs = [
    makeDefinition({ slug: 'python' }), // existing -> update
    makeDefinition({ slug: 'sql' }), // existing -> update
    makeDefinition({ slug: 'rust', canonicalName: 'Rust' }), // new -> create
    makeDefinition({ slug: 'go', canonicalName: 'Go' }), // new -> create
    makeDefinition({ slug: 'java', canonicalName: 'Java' }), // new -> create
  ];

  const result = await upsertMany(defs, client);

  assert.deepStrictEqual(result, { created: 3, updated: 2 });
  assert.strictEqual(client.calls.create.length, 3);
  assert.strictEqual(client.calls.update.length, 2);
});

test('upsertMany is idempotent across repeated runs against the same store', async () => {
  const client = createFakeClient();
  const defs = [
    makeDefinition({ slug: 'rust', canonicalName: 'Rust' }),
    makeDefinition({ slug: 'go', canonicalName: 'Go' }),
    makeDefinition({ slug: 'java', canonicalName: 'Java' }),
  ];

  const first = await upsertMany(defs, client);
  assert.deepStrictEqual(first, { created: 3, updated: 0 });

  const second = await upsertMany(defs, client);
  assert.deepStrictEqual(second, { created: 0, updated: 3 });

  assert.strictEqual(client.store.size, 3, 'no duplicate rows should be created');
});
