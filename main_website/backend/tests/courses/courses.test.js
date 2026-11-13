// What candidates get from the course API: published courses only, lessons without S3
// keys or quiz answers, server-scored quizzes that need every answer, and progress only
// for lessons that exist. Runs on the test store.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/courses/course.controller');

const call = (handler, req) =>
  new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; resolve(this); return this; }
    };
    handler(req, res, reject);
  });

const student = { id: 'cc0000000000000000000001', role: 'STUDENT' };
let course;
let hidden;

test('setup', async () => {
  assert.strictEqual(isMock(), true);
  course = await prisma.course.create({
    data: {
      title: 'Python for data work', description: 'Lists, functions and pandas', category: 'Python',
      modules: [
        { id: 'm2', title: 'Week 2', order: 2, lessons: [{ id: 'l3', title: 'pandas', videoKey: 'courses/c.mp4', order: 1 }] },
        {
          id: 'm1', title: 'Week 1', order: 1,
          lessons: [
            { id: 'l2', title: 'Functions', videoKey: '', order: 2, notes: 'def f(): ...' },
            {
              id: 'l1', title: 'Lists', videoKey: 'courses/a.mp4', documentKey: 'courses/a.pdf', order: 1,
              quiz: { title: 'Quiz 1', questions: [
                { question: 'len([1,2])?', options: ['1', '2', '3'], correctAnswer: 1, explanation: 'Two items.' },
                { question: 'Lists are…', options: ['mutable', 'immutable'], correctAnswer: 0, explanation: '' }
              ] }
            }
          ]
        }
      ]
    }
  });
  hidden = await prisma.course.create({ data: { title: 'Draft', description: 'Not ready', isPublished: false, modules: [{ id: 'mx', title: 'W', order: 1, lessons: [{ id: 'lx', title: 'x', videoKey: 'k' }] }] } });
});

test('the catalog lists published courses with a lesson count and no lessons', async () => {
  const res = await call(controller.listCourses, {});
  assert.deepStrictEqual(res.body.courses.map((c) => c.title), ['Python for data work']);
  assert.strictEqual(res.body.courses[0].lessonCount, 3);
  assert.strictEqual('modules' in res.body.courses[0], false);
});

test('a course comes in order, without S3 keys or quiz answers', async () => {
  const res = await call(controller.getCourse, { user: student, params: { id: course.id } });
  const { modules, enrollment } = res.body.course;
  assert.deepStrictEqual(modules.map((m) => m.lessons.map((l) => l.id)), [['l1', 'l2'], ['l3']]);
  const [lists, functions] = modules[0].lessons;
  assert.strictEqual(lists.hasVideo, true);
  assert.strictEqual(functions.hasVideo, false);
  assert.strictEqual(JSON.stringify(res.body).includes('correctAnswer'), false);
  assert.strictEqual(JSON.stringify(res.body).includes('Two items.'), false);
  assert.strictEqual(JSON.stringify(res.body).includes('courses/a'), false);
  assert.deepStrictEqual(lists.quiz.questions[0], { question: 'len([1,2])?', options: ['1', '2', '3'] });
  assert.deepStrictEqual(enrollment, { completedLessonIds: [], lastAccessedLessonId: null });
});

test('unpublished courses and unknown lessons answer 404', async () => {
  assert.strictEqual((await call(controller.getCourse, { user: student, params: { id: hidden.id } })).statusCode, 404);
  assert.strictEqual((await call(controller.getLessonStream, { user: student, params: { id: hidden.id, lessonId: 'lx' } })).statusCode, 404);
  assert.strictEqual((await call(controller.markProgress, { user: student, params: { id: course.id, lessonId: 'nope' } })).statusCode, 404);
});

test('the stream is the only way to the video; a lesson with no video has none', async () => {
  const res = await call(controller.getLessonStream, { user: student, params: { id: course.id, lessonId: 'l2' } });
  assert.deepStrictEqual(res.body, { success: true, streamUrl: null });
});

test('a quiz needs every answer, is scored on the server and completes the lesson', async () => {
  const part = await call(controller.submitQuiz, { user: student, params: { id: course.id, lessonId: 'l1' }, body: { answers: [1] } });
  assert.strictEqual(part.statusCode, 400);
  const out = await call(controller.submitQuiz, { user: student, params: { id: course.id, lessonId: 'l1' }, body: { answers: [1, 5] } });
  assert.strictEqual(out.statusCode, 400);
  const res = await call(controller.submitQuiz, { user: student, params: { id: course.id, lessonId: 'l1' }, body: { answers: [1, 1] } });
  assert.strictEqual(res.body.correct, 1);
  assert.strictEqual(res.body.total, 2);
  assert.deepStrictEqual(res.body.results, [{ correctAnswer: 1, explanation: 'Two items.' }, { correctAnswer: 0, explanation: '' }]);
  assert.deepStrictEqual(res.body.enrollment.completedLessonIds, ['l1']);
  const noQuiz = await call(controller.submitQuiz, { user: student, params: { id: course.id, lessonId: 'l2' }, body: { answers: [] } });
  assert.strictEqual(noQuiz.statusCode, 400);
});

test('completing lessons adds each once and remembers the last one', async () => {
  await call(controller.markProgress, { user: student, params: { id: course.id, lessonId: 'l2' } });
  const res = await call(controller.markProgress, { user: student, params: { id: course.id, lessonId: 'l1' } });
  assert.deepStrictEqual(res.body.enrollment.completedLessonIds, ['l1', 'l2']);
  assert.strictEqual(res.body.enrollment.lastAccessedLessonId, 'l1');
});

test('only signed-in candidates reach lessons', () => {
  const router = require('../../src/modules/courses/course.routes');
  const guarded = router.stack.filter((layer) => layer.route.path !== '/');
  assert.strictEqual(guarded.length, 4);
  guarded.forEach((layer) => assert.ok(layer.route.stack.length >= 3, `${layer.route.path} needs auth and the candidate check`));
  const candidateOnly = router.stack[1].route.stack[1].handle;
  const res = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  candidateOnly({ user: { id: 'r', role: 'RECRUITER' } }, res, () => assert.fail('recruiter passed'));
  assert.strictEqual(res.statusCode, 403);
});
