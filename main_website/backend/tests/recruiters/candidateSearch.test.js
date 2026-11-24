// Pure parts of the recruiter candidate search (candidateSearch.service.js). The SQL itself is
// checked against PostgreSQL: the in-memory test store can't run raw SQL.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const registry = require('../../src/modules/assessments/question-bank/skills/registryCache');
const { compareSkills, comparisonBars, mergedOptions, latestEducation } = require('../../src/modules/recruiters/candidateSearch.service');
const { candidateSearchSchema } = require('../../src/modules/recruiters/recruiter.validator');

test('skill spellings: punctuation and registry aliases resolve to the same keys', () => {
  registry._setForTesting([{ canonicalName: 'Next.js', aliases: ['NextJS'] }]);
  try {
    assert.deepStrictEqual(registry.spellingsOf('next js').sort(), ['next js', 'nextjs']);
    assert.deepStrictEqual(registry.spellingsOf('Excel'), ['excel']);
  } finally {
    registry._setForTesting(null);
  }
});

test('a candidate against a job: states per bar, and only bars with a test can make them short', () => {
  const job = { requirements: [{ skillName: 'Python', minRating: 6 }, { skillName: 'Next.js', minRating: 5 }, { skillName: 'Teamwork', minRating: 4 }] };
  const bars = comparisonBars(job, new Set(['python']));
  const result = compareSkills([{ name: 'python', rating: 3, verifiedRating: 7 }, { name: 'next js', rating: 5 }], bars);
  assert.deepStrictEqual(result.bars.map((bar) => [bar.skillName, bar.score, bar.state]), [['Python', 7, 'above'], ['Next.js', 5, 'meets'], ['Teamwork', 0, 'below']]);
  assert.strictEqual(result.short, 0, 'Teamwork has no test, so it never makes them short');
  assert.strictEqual(result.meetsAll, true);
  assert.strictEqual(compareSkills([{ name: 'Python', rating: 5 }], bars).short, 1);
});

test('filter menus merge spellings and label each value with its most common one', () => {
  assert.deepStrictEqual(
    mergedOptions([{ value: 'B.Tech', n: 5 }, { value: 'b.tech', n: 1 }, { value: 'BTECH', n: 2 }, { value: 'Bachelor of Science', n: 1 }, { value: '  ', n: 3 }]),
    ['B.Tech', 'Bachelor of Science']
  );
});

test('cards carry only the latest education entry', () => {
  const education = [{ institute: 'School', endDate: '2019-04' }, { degree: 'B.Tech', institute: 'JNTU', endDate: '2025-05' }, { note: 'nothing' }];
  assert.deepStrictEqual(latestEducation(education), [{ degree: 'B.Tech', institute: 'JNTU', endDate: '2025-05' }]);
  assert.deepStrictEqual(latestEducation(null), []);
});

test('search requests: defaults, and limits on page size, years and sorts', () => {
  const parsed = candidateSearchSchema.body.parse({});
  assert.strictEqual(parsed.page, 1);
  assert.strictEqual(parsed.pageSize, 20);
  assert.strictEqual(parsed.sort, 'recommended');
  assert.strictEqual(parsed.countTotal, true);
  assert.strictEqual(candidateSearchSchema.body.safeParse({ year: '2025' }).success, true);
  for (const bad of [{ pageSize: 51 }, { year: '25' }, { sort: 'random' }, { compareJobId: 'not-an-id' }, { skills: new Array(11).fill({ name: 'x' }) }]) {
    assert.strictEqual(candidateSearchSchema.body.safeParse(bad).success, false, JSON.stringify(bad).slice(0, 40));
  }
});
