// Skill tests are marked fairly: answer order is shuffled per test (so the right
// answer can't be guessed from its position), every question must be answered,
// the score is the number right, and the result names the subtopics to work on.
// Runs on the in-memory test store.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/students/student.controller');

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}
const call = async (handler, req) => {
  const res = fakeRes();
  await handler(req, res);
  return res;
};

const user = { id: 'fa0000000000000000000001', role: 'STUDENT' };
const TOPICS = ['Basic Syntax', 'Data Structures', 'File Input Output'];

test('runs against the mock database', () => {
  assert.strictEqual(isMock(), true);
});

test('shuffling keeps the right answer and spreads it over every position', () => {
  const options = ['right', 'wrong 1', 'wrong 2', 'wrong 3'];
  const seen = [0, 0, 0, 0];
  for (let i = 0; i < 4000; i++) {
    const out = controller._shuffleOptions(options, 0);
    assert.strictEqual(out.options[out.correctIndex], 'right');
    assert.deepStrictEqual([...out.options].sort(), [...options].sort());
    seen[out.correctIndex] += 1;
  }
  for (const count of seen) assert.ok(count > 800 && count < 1200, `uneven spread: ${seen}`);
});

test('"All of the above" keeps its place when options are shuffled', () => {
  const options = ['First reason', 'Second reason', 'Third reason', 'All of the above'];
  for (let i = 0; i < 200; i++) {
    const out = controller._shuffleOptions(options, 3);
    assert.strictEqual(out.options[3], 'All of the above');
    assert.strictEqual(out.correctIndex, 3);
  }
});

test('setup: a complete profile and a Python bank of 12 questions', async () => {
  await prisma.profile.create({
    data: { userId: user.id, name: 'Test', username: 't', bio: 'Bio text', gender: 'Female', email: 't@example.com', dob: '2004-01-01', phone: '+91 9876543210', introVideoUrl: 'https://cdn.example.com/v.mp4', skills: [{ name: 'Python', rating: 6, verifiedRating: 6 }] }
  });
  for (let i = 0; i < 12; i++) {
    await prisma.question.create({
      data: { skillName: 'Python', subtopic: TOPICS[i % 3], difficulty: ['Medium', 'Medium-Hard', 'Hard'][i % 3], question: `Question ${i + 1}?`, options: [`right ${i}`, `wrong ${i}a`, `wrong ${i}b`, `wrong ${i}c`], correctIndex: 0 }
    });
  }
});

let session;
let served;

test('a test serves 10 questions with no answer key', async () => {
  const res = await call(controller.generateSkillTest, { user, body: { skillName: 'Python' } });
  assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
  served = res.body.questions;
  assert.strictEqual(served.length, 10);
  for (const q of served) assert.deepStrictEqual(Object.keys(q).sort(), ['id', 'options', 'question']);
  session = await prisma.testSession.findUnique({ where: { id: res.body.sessionId } });
  // The stored key points at each question's right answer in its served order.
  served.forEach((q, i) => assert.match(q.options[session.answerKey[i]], /^right /));
});

test('every question must be answered before the test is scored', async () => {
  const answers = session.answerKey.map((key) => key);
  answers[4] = null;
  const res = await call(controller.submitSkillTest, { user, body: { sessionId: session.id, answers } });
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.body.error, /answer all 10 questions/);
});

test('the score is the number right, with a summary per subtopic', async () => {
  // Right on all but questions 2 and 7.
  const answers = session.answerKey.map((key, i) => (i === 2 || i === 7 ? (key + 1) % 4 : key));
  const res = await call(controller.submitSkillTest, { user, body: { sessionId: session.id, answers } });
  assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
  assert.strictEqual(res.body.correct, 8);
  assert.strictEqual(res.body.rating, 8);
  assert.strictEqual(res.body.passed, true);
  assert.strictEqual(res.body.topics.reduce((sum, t) => sum + t.total, 0), 10);
  assert.strictEqual(res.body.topics.reduce((sum, t) => sum + t.correct, 0), 8);
  for (const topic of res.body.topics) assert.ok(TOPICS.includes(topic.name));

  const again = await call(controller.submitSkillTest, { user, body: { sessionId: session.id, answers } });
  assert.strictEqual(again.statusCode, 400, 'a used test can’t be scored twice');

  const skills = await call(controller.getTechnicalSkills, { user });
  const python = skills.body.technicalSkills.find((s) => s.name === 'Python');
  assert.strictEqual(python.rating, 8);
  assert.strictEqual(python.verifiedRating, 8);
  assert.ok(python.testedAt, 'the date of the last test is returned');
});
