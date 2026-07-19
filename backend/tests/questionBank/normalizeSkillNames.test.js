// Tests for normalizeSkillNames.js's pure logic: canonicalChange, summarise,
// applySkillRenames, applyRequirementRenames.
//
// Why this file exists: the migration's one human safety net before
// --commit is a printed from->to name tally (see summarise/printTally in
// the command). That tally only ever prints names — it structurally cannot
// reveal a regression that silently drops `rating`, `verifiedRating`, or
// `minRating` while renaming a skill. These tests assert those fields
// survive a rename byte-for-byte, so that kind of regression fails a test
// instead of shipping to live profiles.
//
// Safety note (read before touching this file):
// normalizeSkillNames.js does
//   const { prisma } = require('../../config/db');
// at module load time. backend/.env's DATABASE_URL points at a live
// production MongoDB Atlas cluster (see CLAUDE.md), and db.js
// unconditionally fires an unawaited `prismaInstance.user.count()`
// connectivity probe against it the moment it is required — regardless of
// whether this test file ever calls run(). To guarantee these tests can
// never reach that cluster, we pre-populate require.cache for config/db
// with a harmless stub *before* requiring the command module, so db.js's
// real body never executes. Every test below calls only the pure exports
// (canonicalChange, summarise, applySkillRenames, applyRequirementRenames);
// run() is never invoked and no Prisma call is ever made.
const test = require('node:test');
const assert = require('node:assert');

const dbModulePath = require.resolve('../../src/config/db');
require.cache[dbModulePath] = {
  id: dbModulePath,
  filename: dbModulePath,
  loaded: true,
  exports: {
    // Deliberately inert: any call made through this would throw. That's
    // the point — this file never calls run(), so nothing should ever
    // touch this binding.
    prisma: {},
    isMock: () => true,
  },
};

const {
  canonicalChange,
  summarise,
  applySkillRenames,
  applyRequirementRenames,
} = require('../../src/cli/commands/normalizeSkillNames');
const { buildAliasIndex } = require('../../src/services/questionBank/skills/normalize');

function makeIndex() {
  return buildAliasIndex([
    { canonicalName: 'Next.js', aliases: ['Next js'] },
    { canonicalName: 'Python' },
  ]);
}

// -- canonicalChange -------------------------------------------------------

test('canonicalChange resolves an alias to its canonical name', () => {
  const index = makeIndex();
  assert.strictEqual(canonicalChange(index, 'next js'), 'Next.js');
});

test('canonicalChange returns null when the stored name is already canonical', () => {
  const index = makeIndex();
  assert.strictEqual(canonicalChange(index, 'Next.js'), null);
  assert.strictEqual(canonicalChange(index, 'Python'), null);
});

test('canonicalChange returns null for an unknown skill', () => {
  const index = makeIndex();
  assert.strictEqual(canonicalChange(index, 'Cobol'), null);
});

test('canonicalChange returns null without throwing for malformed stored names', () => {
  const index = makeIndex();
  assert.strictEqual(canonicalChange(index, null), null);
  assert.strictEqual(canonicalChange(index, undefined), null);
  assert.strictEqual(canonicalChange(index, 42), null);
  assert.strictEqual(canonicalChange(index, {}), null);
});

// -- applySkillRenames -------------------------------------------------------

test('applySkillRenames renames a matching entry and preserves rating and verifiedRating exactly', () => {
  const index = makeIndex();
  const input = [{ name: 'next js', rating: 3, verifiedRating: 4 }];

  const result = applySkillRenames(index, input);

  assert.strictEqual(result[0].name, 'Next.js');
  assert.strictEqual(result[0].rating, 3);
  assert.strictEqual(result[0].verifiedRating, 4);
});

test('applySkillRenames changes only name on a renamed entry; every other field is untouched', () => {
  const index = makeIndex();
  const input = [{ name: 'next js', rating: 3, verifiedRating: 4, extra: 'keep-me' }];

  const result = applySkillRenames(index, input);

  const { name: _renamedName, ...restRenamed } = result[0];
  const { name: _origName, ...restOriginal } = input[0];
  assert.deepStrictEqual(restRenamed, restOriginal);
});

test('applySkillRenames leaves an untouched entry as the exact same object reference', () => {
  const index = makeIndex();
  const input = [{ name: 'Python', rating: 5 }];

  const result = applySkillRenames(index, input);

  assert.strictEqual(result[0], input[0]);
});

test('applySkillRenames passes an entry with name: null through unchanged without throwing', () => {
  const index = makeIndex();
  const input = [{ name: null, rating: 2 }];

  const result = applySkillRenames(index, input);

  assert.strictEqual(result[0], input[0]);
  assert.strictEqual(result[0].name, null);
});

test('applySkillRenames returns [] for an empty or missing array', () => {
  const index = makeIndex();
  assert.deepStrictEqual(applySkillRenames(index, []), []);
  assert.deepStrictEqual(applySkillRenames(index, undefined), []);
});

// -- applyRequirementRenames -------------------------------------------------

test('applyRequirementRenames renames a matching entry and preserves minRating exactly', () => {
  const index = makeIndex();
  const input = [{ skillName: 'next js', minRating: 4 }];

  const result = applyRequirementRenames(index, input);

  assert.strictEqual(result[0].skillName, 'Next.js');
  assert.strictEqual(result[0].minRating, 4);
});

test('applyRequirementRenames changes only skillName on a renamed entry; every other field is untouched', () => {
  const index = makeIndex();
  const input = [{ skillName: 'next js', minRating: 4, extra: 'keep-me' }];

  const result = applyRequirementRenames(index, input);

  const { skillName: _renamedName, ...restRenamed } = result[0];
  const { skillName: _origName, ...restOriginal } = input[0];
  assert.deepStrictEqual(restRenamed, restOriginal);
});

test('applyRequirementRenames leaves an untouched entry as the exact same object reference', () => {
  const index = makeIndex();
  const input = [{ skillName: 'Python', minRating: 3 }];

  const result = applyRequirementRenames(index, input);

  assert.strictEqual(result[0], input[0]);
});

test('applyRequirementRenames returns [] for an empty or missing array', () => {
  const index = makeIndex();
  assert.deepStrictEqual(applyRequirementRenames(index, []), []);
  assert.deepStrictEqual(applyRequirementRenames(index, undefined), []);
});

// -- summarise ---------------------------------------------------------

test('summarise tallies repeated renames of the same from->to pair and ignores unchanged rows', () => {
  const changes = [
    {
      before: [{ name: 'next js' }, { name: 'Python' }],
      after: [{ name: 'Next.js' }, { name: 'Python' }],
    },
    {
      before: [{ name: 'next js' }],
      after: [{ name: 'Next.js' }],
    },
  ];

  const tally = summarise(changes, 'name');

  assert.strictEqual(tally.size, 1);
  assert.strictEqual(tally.get('next js  ->  Next.js'), 2);
});
