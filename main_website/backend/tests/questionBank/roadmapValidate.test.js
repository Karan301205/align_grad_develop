const { test } = require('node:test');
const assert = require('node:assert');
const {
  validateRoadmap,
  validateRoadmapSet,
} = require('../../src/services/questionBank/roadmap/validate');

function subs(n) {
  return Array.from({ length: n }, (_, i) => `Subtopic ${i + 1}`);
}

test('validateRoadmap accepts a well-formed roadmap', () => {
  const r = { skillName: 'Python', popularityRank: 1, subtopics: subs(12) };
  assert.deepStrictEqual(validateRoadmap(r), { valid: true, errors: [] });
});

test('validateRoadmap rejects too few / too many subtopics', () => {
  assert.strictEqual(validateRoadmap({ skillName: 'Python', popularityRank: 1, subtopics: subs(9) }).valid, false);
  assert.strictEqual(validateRoadmap({ skillName: 'Python', popularityRank: 1, subtopics: subs(16) }).valid, false);
});

test('validateRoadmap rejects duplicate subtopics (case-insensitive)', () => {
  const list = subs(11).concat('subtopic 1'); // dup of "Subtopic 1", length 12
  const v = validateRoadmap({ skillName: 'Python', popularityRank: 1, subtopics: list });
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => e.includes('duplicate subtopics')));
});

test('validateRoadmap rejects empty subtopic entries', () => {
  const list = subs(11).concat('   ');
  assert.strictEqual(validateRoadmap({ skillName: 'Python', popularityRank: 1, subtopics: list }).valid, false);
});

test('validateRoadmap rejects bad rank and missing skillName', () => {
  assert.strictEqual(validateRoadmap({ skillName: '', popularityRank: 1, subtopics: subs(12) }).valid, false);
  assert.strictEqual(validateRoadmap({ skillName: 'X', popularityRank: 0, subtopics: subs(12) }).valid, false);
  assert.strictEqual(validateRoadmap({ skillName: 'X', popularityRank: 1.5, subtopics: subs(12) }).valid, false);
});

test('validateRoadmapSet accepts a clean, fully-covering set', () => {
  const roadmaps = [
    { skillName: 'Python', popularityRank: 1, subtopics: subs(12) },
    { skillName: 'JavaScript', popularityRank: 2, subtopics: subs(10) },
    { skillName: 'SQL', popularityRank: 3, subtopics: subs(15) },
  ];
  const v = validateRoadmapSet(roadmaps, ['Python', 'JavaScript', 'SQL']);
  assert.deepStrictEqual(v.errors, []);
  assert.strictEqual(v.valid, true);
  assert.strictEqual(v.count, 3);
});

test('validateRoadmapSet flags duplicate ranks', () => {
  const v = validateRoadmapSet([
    { skillName: 'Python', popularityRank: 1, subtopics: subs(12) },
    { skillName: 'JavaScript', popularityRank: 1, subtopics: subs(12) },
  ]);
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => e.includes('not unique')));
});

test('validateRoadmapSet flags non-contiguous ranks', () => {
  const v = validateRoadmapSet([
    { skillName: 'Python', popularityRank: 1, subtopics: subs(12) },
    { skillName: 'JavaScript', popularityRank: 2, subtopics: subs(12) },
    { skillName: 'SQL', popularityRank: 4, subtopics: subs(12) },
  ]);
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => e.includes('contiguous')));
});

test('validateRoadmapSet flags missing coverage', () => {
  const v = validateRoadmapSet(
    [{ skillName: 'Python', popularityRank: 1, subtopics: subs(12) }],
    ['Python', 'Go', 'Rust']
  );
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => e.includes('missing roadmaps for 2')));
});

test('validateRoadmapSet flags duplicate skillNames', () => {
  const v = validateRoadmapSet([
    { skillName: 'Python', popularityRank: 1, subtopics: subs(12) },
    { skillName: 'python', popularityRank: 2, subtopics: subs(12) },
  ]);
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => e.includes('duplicate skillNames')));
});
