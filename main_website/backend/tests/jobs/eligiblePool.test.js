// Post-a-job candidate count: same gating rule as applying (technical skill with
// active bank questions), plus the "lowering X adds N" suggestion. Mock DB only.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { summarizePool } = require('../../src/modules/jobs/eligiblePool');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/recruiters/recruiter.controller');

const quiz = new Set(['sql', 'python']);
const person = (skills) => ({ skills: Object.entries(skills).map(([name, verifiedRating]) => ({ name, rating: 1, verifiedRating })) });

test('counts only candidates who clear every gating bar', () => {
  const profiles = [
    person({ SQL: 7, Python: 6 }), // meets both
    person({ SQL: 8, Python: 9 }), // meets both
    person({ SQL: 6, Python: 6 }), // SQL one short
    person({ SQL: 3, Python: 6 }), // SQL far short
    person({ Python: 6 }) // no SQL at all
  ];
  const result = summarizePool([{ skillName: 'SQL', minRating: 7 }, { skillName: 'Python', minRating: 6 }], profiles, quiz);
  assert.strictEqual(result.eligible, 2);
  assert.strictEqual(result.total, 5);
  assert.deepStrictEqual(result.bestRelaxation, { skillName: 'SQL', from: 7, to: 6, adds: 1 });
});

test('bars on soft skills or skills without bank questions never gate, as when applying', () => {
  const result = summarizePool(
    [{ skillName: 'Communication', minRating: 9 }, { skillName: 'Excel', minRating: 9 }],
    [person({}), person({ Excel: 2 })],
    quiz
  );
  assert.strictEqual(result.eligible, 2);
  assert.deepStrictEqual(result.requirements.map((r) => r.gates), [false, false]);
  assert.strictEqual(result.bestRelaxation, null);
});

test('no bars means everyone qualifies', () => {
  const result = summarizePool([], [person({}), person({ SQL: 1 })], quiz);
  assert.strictEqual(result.eligible, 2);
  assert.deepStrictEqual(result.requirements, []);
});

test('controller runs against the mock DB and returns only aggregate numbers', async () => {
  assert.strictEqual(isMock(), true);
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
  await controller.getEligibleCandidateCount({ user: { id: 'r1', role: 'RECRUITER' }, body: { requirements: [{ skillName: 'Python', minRating: 5 }] } }, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(Object.keys(res.body).sort(), ['bestRelaxation', 'eligible', 'requirements', 'total']);
  assert.strictEqual(res.body.total, (await prisma.profile.findMany()).length);
});
