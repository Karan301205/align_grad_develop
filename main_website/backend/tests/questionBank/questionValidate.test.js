const { test } = require('node:test');
const assert = require('node:assert');
const { validateQuestion, normalizeText } = require('../../src/services/questionBank/question/validate');

function goodQ(over = {}) {
  return {
    question: 'What does a load balancer primarily provide in a production web tier?',
    options: ['Traffic distribution', 'Data encryption at rest', 'Source control', 'Unit testing'],
    correctIndex: 0,
    difficulty: 'Medium',
    explanation: 'A load balancer distributes incoming traffic across healthy backends.',
    tags: ['scalability', 'infrastructure'],
    ...over,
  };
}

test('validateQuestion accepts a well-formed MCQ', () => {
  assert.deepStrictEqual(validateQuestion(goodQ()), { valid: true, errors: [] });
});

test('rejects when not exactly 4 options', () => {
  assert.strictEqual(validateQuestion(goodQ({ options: ['a', 'b', 'c'] })).valid, false);
  assert.strictEqual(validateQuestion(goodQ({ options: ['a', 'b', 'c', 'd', 'e'] })).valid, false);
});

test('rejects duplicate options (case-insensitive)', () => {
  const v = validateQuestion(goodQ({ options: ['Traffic', 'traffic', 'c', 'd'] }));
  assert.strictEqual(v.valid, false);
  assert.ok(v.errors.some(e => e.includes('duplicate options')));
});

test('rejects correctIndex outside 0-3 or non-integer', () => {
  assert.strictEqual(validateQuestion(goodQ({ correctIndex: 4 })).valid, false);
  assert.strictEqual(validateQuestion(goodQ({ correctIndex: -1 })).valid, false);
  assert.strictEqual(validateQuestion(goodQ({ correctIndex: 1.5 })).valid, false);
});

test('rejects missing explanation', () => {
  assert.strictEqual(validateQuestion(goodQ({ explanation: '   ' })).valid, false);
});

test('rejects easy / invalid difficulty', () => {
  assert.strictEqual(validateQuestion(goodQ({ difficulty: 'Easy' })).valid, false);
  assert.strictEqual(validateQuestion(goodQ({ difficulty: undefined })).valid, false);
});

test('accepts each allowed difficulty', () => {
  for (const d of ['Medium', 'Medium-Hard', 'Hard']) {
    assert.strictEqual(validateQuestion(goodQ({ difficulty: d })).valid, true);
  }
});

test('flags skill/subtopic mismatch when context is supplied', () => {
  const q = goodQ({ skillName: 'Python', subtopic: 'Decorators' });
  assert.strictEqual(validateQuestion(q, { skillName: 'Go', subtopic: 'Decorators' }).valid, false);
  assert.strictEqual(validateQuestion(q, { skillName: 'Python', subtopic: 'Decorators' }).valid, true);
});

test('normalizeText collapses case/punctuation/whitespace for dedup', () => {
  assert.strictEqual(normalizeText('  What IS a Closure?? '), 'what is a closure');
  assert.strictEqual(normalizeText('what is a closure'), normalizeText('What is a closure.'));
});
