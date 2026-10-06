// Tests for registryCache — the boot-time cached alias index consumed by
// skillMatching.service.js on the hot job-matching path.
//
// Safety note (read before touching this file):
// registryCache.js does
//   const repo = require('../repositories/skillDefinitionRepository');
// which in turn does
//   const { prisma } = require('../../../config/db');
// at module load time. backend/.env's DATABASE_URL points at a live
// production MongoDB Atlas cluster (see CLAUDE.md), and db.js
// unconditionally fires an unawaited `prismaInstance.user.count()`
// connectivity probe against it the moment it is required. To guarantee
// these tests can never reach that cluster, we pre-populate require.cache
// for config/db with a harmless stub *before* requiring registryCache, so
// db.js's real body never executes — mirroring the pattern in
// backend/tests/questionBank/skillDefinitionRepository.test.js. These tests
// only ever exercise _setForTesting() and never call load(), so the stub
// needs no query methods at all.
const test = require('node:test');
const assert = require('node:assert');

const dbModulePath = require.resolve('../../src/config/db');
require.cache[dbModulePath] = {
  id: dbModulePath,
  filename: dbModulePath,
  loaded: true,
  exports: {
    // Deliberately inert: any call made through this would throw. That's
    // the point — these tests never call load(), so nothing should ever
    // reach this module-level binding.
    prisma: {},
    isMock: () => true,
  },
};

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
