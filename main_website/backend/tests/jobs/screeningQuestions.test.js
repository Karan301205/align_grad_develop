// Screening question rules: recruiter-side question checks, saving, candidate-facing
// stripping and server-side answer evaluation. Pure functions, no database.
const test = require('node:test');
const assert = require('node:assert');
const {
  SCREENING_TYPES,
  getQuestionProblem,
  normalizeQuestions,
  toCandidateQuestions,
  evaluateAnswers
} = require('../../src/modules/jobs/screeningQuestions');
const { postJobSchema } = require('../../src/modules/recruiters/recruiter.validator');
const { applyJobSchema } = require('../../src/modules/students/student.validator');

const Q = {
  mcq: { id: 'q1', type: 'MCQ', question: 'Which status code means Created?', options: ['200', '201', '404'], correctAnswer: '201', required: true },
  short: { id: 'q2', type: 'SHORT_ANSWER', question: 'Current city?', options: [], required: true },
  long: { id: 'q3', type: 'LONG_ANSWER', question: 'Tell us about a project.', options: [], required: false },
  box: { id: 'q4', type: 'CHECKBOX', question: 'Which tools have you used?', options: ['Git', 'Docker', 'Kubernetes'], required: true },
  date: { id: 'q5', type: 'DATE', question: 'Earliest joining date?', options: [], required: true },
  time: { id: 'q6', type: 'TIME', question: 'Preferred interview time?', options: [], required: false }
};
const ALL = Object.values(Q);
const answer = (q, value) => ({ questionId: q.id, questionText: q.question, type: q.type, answer: value });

test('supports the six question types', () => {
  assert.deepStrictEqual(SCREENING_TYPES, ['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'CHECKBOX', 'DATE', 'TIME']);
});

test('getQuestionProblem accepts every well-formed type', () => {
  for (const q of ALL) assert.strictEqual(getQuestionProblem(q), null, q.type);
});

test('getQuestionProblem enforces option rules', () => {
  assert.match(getQuestionProblem({ ...Q.mcq, options: ['Only one'] }), /at least 2 options/);
  assert.match(getQuestionProblem({ ...Q.mcq, correctAnswer: '' }), /correct answer/);
  assert.match(getQuestionProblem({ ...Q.mcq, correctAnswer: '500' }), /correct answer/);
  assert.match(getQuestionProblem({ ...Q.mcq, options: ['A', 'a'], correctAnswer: 'A' }), /different/);
  assert.match(getQuestionProblem({ ...Q.box, options: [] }), /at least 1 option/);
  assert.match(getQuestionProblem({ ...Q.box, options: Array.from({ length: 9 }, (_, i) => `T${i}`) }), /at most 8/);
  assert.match(getQuestionProblem({ ...Q.short, question: '  ' }), /Question text/);
  assert.match(getQuestionProblem({ ...Q.short, type: 'ESSAY' }), /Unsupported/);
});

test('normalizeQuestions trims, drops options and keys where they do not apply', () => {
  const [mcq, short, box] = normalizeQuestions(
    [
      { type: 'MCQ', question: ' Pick one ', options: [' A ', '', 'B'], correctAnswer: ' A ' },
      { type: 'SHORT_ANSWER', question: 'City', options: ['stale'], correctAnswer: 'stale', required: false },
      { id: 'keep', type: 'CHECKBOX', question: 'Tools', options: ['Git'], correctAnswer: 'Git' }
    ],
    () => 'new-id'
  );
  assert.deepStrictEqual(mcq, { id: 'new-id', type: 'MCQ', question: 'Pick one', options: ['A', 'B'], correctAnswer: 'A', required: true });
  assert.deepStrictEqual(short, { id: 'new-id', type: 'SHORT_ANSWER', question: 'City', options: [], correctAnswer: null, required: false });
  assert.strictEqual(box.id, 'keep');
  assert.strictEqual(box.correctAnswer, null);
});

test('toCandidateQuestions removes the answer key', () => {
  const stripped = toCandidateQuestions([Q.mcq, Q.box]);
  assert.strictEqual('correctAnswer' in stripped[0], false);
  assert.deepStrictEqual(stripped[0].options, Q.mcq.options);
  assert.deepStrictEqual(toCandidateQuestions(null), []);
});

test('evaluateAnswers stores every type and scores the MCQ', () => {
  const result = evaluateAnswers(ALL, [
    answer(Q.mcq, ' 201 '),
    answer(Q.short, 'Bengaluru'),
    answer(Q.long, 'Built a hiring platform.'),
    answer(Q.box, ['docker', 'Git']),
    answer(Q.date, '2026-12-01'),
    answer(Q.time, '14:30')
  ]);
  assert.strictEqual(result.error, undefined);
  const byId = Object.fromEntries(result.answers.map((a) => [a.questionId, a]));
  assert.strictEqual(byId.q1.answer, '201');
  assert.strictEqual(byId.q1.isCorrect, true);
  assert.strictEqual(byId.q2.isCorrect, null);
  // Checkbox answers keep option spelling and order; `answer` stays a readable string.
  assert.deepStrictEqual(byId.q4.selectedOptions, ['Git', 'Docker']);
  assert.strictEqual(byId.q4.answer, 'Git, Docker');
  assert.strictEqual(byId.q5.answer, '2026-12-01');
  assert.strictEqual(byId.q6.answer, '14:30');
});

test('evaluateAnswers marks a wrong MCQ choice incorrect', () => {
  const { answers } = evaluateAnswers([Q.mcq], [answer(Q.mcq, '404')]);
  assert.strictEqual(answers[0].isCorrect, false);
});

test('evaluateAnswers skips blank optional questions and refuses blank required ones', () => {
  const ok = evaluateAnswers([Q.long, Q.time], [answer(Q.long, '   ')]);
  assert.deepStrictEqual(ok.answers, []);
  assert.match(evaluateAnswers([Q.box], [answer(Q.box, [])]).error, /required screening question: "Which tools/);
  assert.match(evaluateAnswers([Q.date], []).error, /Earliest joining date/);
});

test('evaluateAnswers refuses answers that do not fit the type', () => {
  assert.match(evaluateAnswers([Q.mcq], [answer(Q.mcq, 'Maybe')]).error, /listed options/);
  assert.match(evaluateAnswers([Q.box], [answer(Q.box, ['Git', 'Excel'])]).error, /listed options/);
  assert.match(evaluateAnswers([Q.date], [answer(Q.date, '2026-02-30')]).error, /valid date/);
  assert.match(evaluateAnswers([Q.date], [answer(Q.date, '01/12/2026')]).error, /valid date/);
  assert.match(evaluateAnswers([Q.time], [answer(Q.time, '25:00')]).error, /valid time/);
  assert.match(evaluateAnswers([Q.short], [answer(Q.short, 'x'.repeat(201))]).error, /too long/);
  assert.match(evaluateAnswers([Q.short], [answer(Q.short, ['a', 'b'])]).error, /text answer/);
});

test('evaluateAnswers matches legacy answers by question text and treats untyped questions as long answer', () => {
  const legacy = { question: 'Why us?', options: [], required: true };
  const { answers } = evaluateAnswers([legacy], [{ questionText: 'why us?', answer: 'Mission' }]);
  assert.strictEqual(answers[0].type, 'LONG_ANSWER');
  assert.strictEqual(answers[0].answer, 'Mission');
});

test('postJobSchema accepts the new question types and rejects a checkbox without options', () => {
  const base = { title: 'Frontend developer', description: 'Build the hiring UI for our customers.', requirements: [{ skillName: 'React', minRating: 5 }] };
  const parsed = postJobSchema.body.parse({ ...base, screeningQuestions: ALL });
  assert.deepStrictEqual(parsed.screeningQuestions.map((q) => q.type), SCREENING_TYPES);
  assert.throws(() => postJobSchema.body.parse({ ...base, screeningQuestions: [{ ...Q.box, options: [] }] }), /at least 1 option/);
});

test('applyJobSchema accepts checkbox arrays and blank optional answers', () => {
  const parsed = applyJobSchema.body.parse({
    answers: [answer(Q.box, ['Git']), answer(Q.long, ''), { questionId: 'q6', answer: '09:00' }]
  });
  assert.deepStrictEqual(parsed.answers[0].answer, ['Git']);
  assert.strictEqual(parsed.answers[1].answer, '');
});
