import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COURSE_TABS,
  buildQuiz,
  courseToForm,
  emptyCourseForm,
  emptyLessonForm,
  emptyQuestion,
  emptyQuizForm,
  filterCourses,
  isPublished,
  lectureCount,
  lessonToForm,
  optionLabel,
  quizToForm,
  unwrap
} from './courseModel.js';

/* ---- unwrap ---- */

test('unwrap returns a successful answer and throws the server message otherwise', () => {
  const ok = { success: true, courses: [] };
  assert.equal(unwrap(ok, 'x'), ok);
  assert.throws(() => unwrap({ success: false, error: 'Course not found' }, 'fallback'), /Course not found/);
  assert.throws(() => unwrap({ success: false }, 'fallback'), /fallback/);
  assert.throws(() => unwrap(undefined, 'fallback'), /fallback/);
});

/* ---- courses ---- */

test('a new course is published by default and branded AlignGrad', () => {
  const form = emptyCourseForm();
  assert.equal(form.isPublished, true);
  assert.equal(form.instructor, 'AlignGrad Academy');
  assert.equal(form.title, '');
});

test('courseToForm never produces null/undefined inputs and keeps published unless explicitly false', () => {
  const form = courseToForm({ title: 'T', description: 'D', instructor: null, thumbnailUrl: null, category: undefined });
  assert.deepEqual(Object.values(form).filter((v) => v === null || v === undefined), []);
  assert.equal(form.isPublished, true);
  assert.equal(courseToForm({ isPublished: false }).isPublished, false);
});

test('lectureCount prefers the server total and falls back to counting lessons', () => {
  assert.equal(lectureCount({ totalLessons: 7, modules: [] }), 7);
  assert.equal(lectureCount({ totalLessons: 0, modules: [{ lessons: [{}] }] }), 0);
  assert.equal(lectureCount({ modules: [{ lessons: [{}, {}] }, { lessons: [{}] }, {}] }), 3);
  assert.equal(lectureCount({}), 0);
  assert.equal(lectureCount(null), 0);
});

const courses = [
  { id: 1, title: 'React Basics', category: 'Frontend', instructor: 'Ada', isPublished: true },
  { id: 2, title: 'Node APIs', category: 'Backend', instructor: 'Linus', isPublished: false },
  { id: 3, title: 'Untitled draft', category: 'General', instructor: null }
];

test('isPublished treats a missing flag as published', () => {
  assert.deepEqual(courses.map(isPublished), [true, false, true]);
});

test('course tabs split published from drafts', () => {
  const ids = (key) => filterCourses(courses, { tab: key }).map((c) => c.id);
  assert.deepEqual(ids('all'), [1, 2, 3]);
  assert.deepEqual(ids('published'), [1, 3]);
  assert.deepEqual(ids('draft'), [2]);
  assert.equal(COURSE_TABS.length, 3);
});

test('filterCourses searches title, category and instructor together with the tab', () => {
  const ids = (opts) => filterCourses(courses, opts).map((c) => c.id);
  assert.deepEqual(ids({ query: 'react' }), [1]);
  assert.deepEqual(ids({ query: 'BACKEND' }), [2]);
  assert.deepEqual(ids({ query: 'linus' }), [2]);
  assert.deepEqual(ids({ tab: 'published', query: 'node' }), []);
  assert.deepEqual(ids({ query: 'zzz' }), []);
});

/* ---- lessons ---- */

test('a new lesson starts with a 15:00 duration and no video', () => {
  const form = emptyLessonForm();
  assert.equal(form.duration, '15:00');
  assert.equal(form.videoKey, '');
});

test('lessonToForm fills every field so inputs stay controlled', () => {
  const form = lessonToForm({ title: 'L', videoKey: 'k', documentUrl: null });
  assert.equal(form.title, 'L');
  assert.equal(form.duration, '15:00');
  assert.deepEqual(Object.values(form).filter((v) => v === null || v === undefined), []);
});

/* ---- quizzes ---- */

test('optionLabel gives A, B, C…', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(optionLabel), ['A', 'B', 'C', 'D', 'E']);
});

test('a lesson without a saved quiz starts with the quiz off and one blank question', () => {
  for (const saved of [undefined, null, {}, { questions: [] }]) {
    const form = quizToForm(saved);
    assert.equal(form.enabled, false);
    assert.equal(form.questions.length, 1);
    assert.deepEqual(form.questions[0], emptyQuestion());
  }
});

test('quizToForm turns a saved quiz back into an enabled form', () => {
  const form = quizToForm({ title: 'Quiz: Week 1', questions: [{ question: 'Q?', options: ['a', 'b', 'c', 'd'], correctAnswer: 2, explanation: 'because' }] });
  assert.equal(form.enabled, true);
  assert.equal(form.title, 'Quiz: Week 1');
  assert.equal(form.questions[0].correctAnswer, 2);
  assert.equal(form.questions[0].explanation, 'because');
});

test('quizToForm keeps options beyond four and pads fewer than four', () => {
  const many = quizToForm({ questions: [{ question: 'Q', options: ['1', '2', '3', '4', '5', '6'], correctAnswer: 5 }] });
  assert.equal(many.questions[0].options.length, 6);
  assert.equal(many.questions[0].correctAnswer, 5);
  const few = quizToForm({ questions: [{ question: 'Q', options: ['x', 'y'], correctAnswer: 1 }] });
  assert.deepEqual(few.questions[0].options, ['x', 'y', '', '']);
});

test('quizToForm repairs a correct answer that points past the options', () => {
  assert.equal(quizToForm({ questions: [{ question: 'Q', options: ['a', 'b', 'c', 'd'], correctAnswer: 9 }] }).questions[0].correctAnswer, 0);
  assert.equal(quizToForm({ questions: [{ question: 'Q', options: ['a', 'b', 'c', 'd'], correctAnswer: 'x' }] }).questions[0].correctAnswer, 0);
});

const filled = (overrides = {}) => ({ question: 'What is 2+2?', options: ['3', '4', '5', '6'], correctAnswer: 1, explanation: ' basic maths ', ...overrides });

test('buildQuiz returns null when the quiz is switched off, whatever is typed', () => {
  assert.deepEqual(buildQuiz({ enabled: false, title: 'x', questions: [filled()] }, 'L'), { quiz: null });
});

test('buildQuiz trims everything and keeps the chosen correct answer', () => {
  const { quiz, error } = buildQuiz({ enabled: true, title: '  Week 1 quiz ', questions: [filled({ question: '  What is 2+2? ', options: [' 3', '4 ', '5', '6'] })] }, 'Lesson');
  assert.equal(error, undefined);
  assert.equal(quiz.title, 'Week 1 quiz');
  assert.deepEqual(quiz.questions, [{ question: 'What is 2+2?', options: ['3', '4', '5', '6'], correctAnswer: 1, explanation: 'basic maths' }]);
});

test('buildQuiz titles a blank quiz after the lesson', () => {
  assert.equal(buildQuiz({ enabled: true, title: '   ', questions: [filled()] }, ' Intro to SQL ').quiz.title, 'Quiz: Intro to SQL');
});

test('buildQuiz ignores completely blank questions', () => {
  const { quiz } = buildQuiz({ enabled: true, title: 't', questions: [emptyQuestion(), filled(), emptyQuestion()] }, 'L');
  assert.equal(quiz.questions.length, 1);
});

test('buildQuiz refuses a quiz with no questions at all', () => {
  assert.match(buildQuiz({ enabled: true, title: 't', questions: [emptyQuestion()] }, 'L').error, /at least one question/);
  assert.match(buildQuiz({ enabled: true, title: 't', questions: [] }, 'L').error, /at least one question/);
});

test('buildQuiz never invents answer text: a blank option is an error naming the question', () => {
  const result = buildQuiz({ enabled: true, title: 't', questions: [filled(), filled({ options: ['a', 'b', '', 'd'] })] }, 'L');
  assert.match(result.error, /Question 2: fill in every answer option/);
  assert.equal(result.quiz, undefined);
});

test('buildQuiz numbers a problem by its position in the form, even after a blank question', () => {
  const result = buildQuiz({ enabled: true, title: 't', questions: [emptyQuestion(), filled({ question: '   ', options: ['a', 'b', 'c', 'd'] })] }, 'L');
  assert.match(result.error, /Question 2: enter the question text/);
});

test('buildQuiz treats a missing correct answer as the first option', () => {
  assert.equal(buildQuiz({ enabled: true, title: 't', questions: [filled({ correctAnswer: undefined })] }, 'L').quiz.questions[0].correctAnswer, 0);
});

test('emptyQuizForm is off with one blank question', () => {
  const form = emptyQuizForm();
  assert.equal(form.enabled, false);
  assert.equal(form.questions.length, 1);
});
