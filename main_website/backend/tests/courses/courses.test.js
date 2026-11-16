// What candidates get from the course API: published courses only, lessons without S3
// keys or quiz answers, server-scored quizzes that need every answer, and progress only
// for lessons that exist, reference documents that open through a CloudFront signed link, and lessons that
// complete only when their video is half watched (time counted by the server) and their quiz is submitted.
// Runs on the test store.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
// CloudFront settings are read when the service loads, so they are set first (a throwaway key, never a real one)
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const keyFile = path.join(os.tmpdir(), `courses-test-${process.pid}.pem`);
fs.writeFileSync(keyFile, privateKey.export({ type: 'pkcs1', format: 'pem' }));
process.env.CLOUDFRONT_DOMAIN = 'cdn.test.invalid';
process.env.CLOUDFRONT_KEY_ID = 'KTESTKEYID';
process.env.CLOUDFRONT_PRIVATE_KEY_PATH = keyFile;
process.env.S3_BUCKET_NAME = 'test-bucket';

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
  assert.strictEqual(lists.hasDocument, true);
  assert.strictEqual(functions.hasDocument, false);
  assert.strictEqual(JSON.stringify(res.body).includes('documentKey'), false);
  assert.strictEqual(JSON.stringify(res.body).includes('documentUrl'), false);
  assert.strictEqual(JSON.stringify(res.body).includes('correctAnswer'), false);
  assert.strictEqual(JSON.stringify(res.body).includes('Two items.'), false);
  assert.strictEqual(JSON.stringify(res.body).includes('courses/a'), false);
  assert.deepStrictEqual(lists.quiz.questions[0], { question: 'len([1,2])?', options: ['1', '2', '3'] });
  assert.deepStrictEqual(enrollment, { completedLessonIds: [], lastAccessedLessonId: null, lessonProgress: {} });
  assert.deepStrictEqual(modules.flatMap((m) => m.lessons.map((l) => [l.id, l.watchRequired])), [['l1', true], ['l2', false], ['l3', true]]);
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

test('a quiz needs every answer and is scored on the server', async () => {
  const part = await call(controller.submitQuiz, { user: student, params: { id: course.id, lessonId: 'l1' }, body: { answers: [1] } });
  assert.strictEqual(part.statusCode, 400);
  const out = await call(controller.submitQuiz, { user: student, params: { id: course.id, lessonId: 'l1' }, body: { answers: [1, 5] } });
  assert.strictEqual(out.statusCode, 400);
  const res = await call(controller.submitQuiz, { user: student, params: { id: course.id, lessonId: 'l1' }, body: { answers: [1, 1] } });
  assert.strictEqual(res.body.correct, 1);
  assert.strictEqual(res.body.total, 2);
  assert.deepStrictEqual(res.body.results, [{ correctAnswer: 1, explanation: 'Two items.' }, { correctAnswer: 0, explanation: '' }]);
  // l1 also has a video, so submitting the quiz alone does not finish the lesson
  assert.deepStrictEqual(res.body.enrollment.completedLessonIds, []);
  assert.strictEqual(res.body.enrollment.lessonProgress.l1.quizAnswered, true);
  const noQuiz = await call(controller.submitQuiz, { user: student, params: { id: course.id, lessonId: 'l2' }, body: { answers: [] } });
  assert.strictEqual(noQuiz.statusCode, 400);
});

const learner = (n) => ({ id: `cc00000000000000000000${String(n).padStart(2, '0')}`, role: 'STUDENT' });
const progressCall = (handler, user, lessonId, extra = {}, courseId = course.id) => call(handler, { user, params: { id: courseId, lessonId }, ...extra });
const watch = (user, lessonId, seconds, duration, courseId) => progressCall(controller.reportWatch, user, lessonId, { body: { seconds, duration } }, courseId);
const quiz = (user, lessonId) => progressCall(controller.submitQuiz, user, lessonId, { body: { answers: [1, 0] } });

// Watch reports are judged against real time, so these tests move the clock by hand.
async function withClock(run) {
  const realNow = Date.now;
  let at = realNow();
  Date.now = () => at;
  try {
    await run((ms) => { at += ms; });
  } finally {
    Date.now = realNow;
  }
}

test('opening a lesson completes it only when it asks for nothing', async () => {
  const user = learner(1);
  const none = await progressCall(controller.markProgress, user, 'l2');
  assert.deepStrictEqual(none.body.enrollment.completedLessonIds, ['l2']);
  assert.strictEqual(none.body.enrollment.lastAccessedLessonId, 'l2');
  assert.deepStrictEqual((await progressCall(controller.markProgress, user, 'l2')).body.enrollment.completedLessonIds, ['l2']); // once

  const video = await progressCall(controller.markProgress, user, 'l3');
  assert.strictEqual(video.statusCode, 400);
  assert.match(video.body.error, /watch half of the video/);
  const both = await progressCall(controller.markProgress, user, 'l1');
  assert.strictEqual(both.statusCode, 400);
  assert.match(both.body.error, /watch half of the video and submit the quiz/);
});

test('half the video, as watch time counted by the server, completes a lesson with no quiz', async () => {
  const user = learner(2);
  await withClock(async (later) => {
    let res = await watch(user, 'l3', 20, 100); // needs 50 seconds of a 100 second video
    assert.deepStrictEqual(res.body.enrollment.lessonProgress.l3, { watchedSeconds: 20, durationSeconds: 100, quizAnswered: false });
    assert.deepStrictEqual(res.body.enrollment.completedLessonIds, []);
    later(10000);
    res = await watch(user, 'l3', 20, 100);
    assert.strictEqual(res.body.enrollment.lessonProgress.l3.watchedSeconds, 40);
    assert.deepStrictEqual(res.body.enrollment.completedLessonIds, []);
    later(10000);
    res = await watch(user, 'l3', 20, 100);
    assert.strictEqual(res.body.enrollment.lessonProgress.l3.watchedSeconds, 60);
    assert.deepStrictEqual(res.body.enrollment.completedLessonIds, ['l3']);
    assert.strictEqual(res.body.enrollment.lastAccessedLessonId, 'l3');
  });
  // what the candidate reads back has no server timestamps
  const shown = (await call(controller.getCourse, { user, params: { id: course.id } })).body.course.enrollment;
  assert.deepStrictEqual(shown.lessonProgress.l3, { watchedSeconds: 60, durationSeconds: 100, quizAnswered: false });
  assert.strictEqual(JSON.stringify(shown).includes('lastReportAt'), false);
});

test('watch time cannot be claimed faster than real time', async () => {
  const user = learner(3);
  await withClock(async (later) => {
    let res = await watch(user, 'l3', 9999, 100);
    assert.strictEqual(res.body.enrollment.lessonProgress.l3.watchedSeconds, 30); // one report adds at most 30 s
    res = await watch(user, 'l3', 9999, 100); // same instant: almost nothing
    assert.ok(res.body.enrollment.lessonProgress.l3.watchedSeconds <= 31);
    assert.deepStrictEqual(res.body.enrollment.completedLessonIds, []);
    later(4000); // 4 s later, playing at up to 2x speed: 8 s of video at most (plus a second of slack)
    res = await watch(user, 'l3', 30, 100);
    assert.ok(res.body.enrollment.lessonProgress.l3.watchedSeconds <= 31 + 11);
    assert.deepStrictEqual(res.body.enrollment.completedLessonIds, []);
  });
});

test('a watch report must be well formed and for a lesson with a video to time', async () => {
  const user = learner(4);
  assert.strictEqual((await watch(user, 'l3', -5, 100)).statusCode, 400);
  assert.strictEqual((await watch(user, 'l3', 10, 0)).statusCode, 400);
  assert.strictEqual((await watch(user, 'l3', 10, 'long')).statusCode, 400);
  assert.strictEqual((await watch(user, 'l3', 10, 10 * 24 * 3600)).statusCode, 400);
  assert.strictEqual((await watch(user, 'l2', 10, 100)).statusCode, 400); // no video
  assert.strictEqual((await watch(user, 'nope', 10, 100)).statusCode, 404);
  assert.strictEqual((await watch(user, 'lx', 10, 100, hidden.id)).statusCode, 404);
});

test('a lesson with a video and a quiz needs both, in either order', async () => {
  await withClock(async () => {
    // quiz first, then the video
    const first = learner(5);
    let res = await quiz(first, 'l1');
    assert.deepStrictEqual(res.body.enrollment.completedLessonIds, []);
    res = await watch(first, 'l1', 30, 60); // half of 60 s
    assert.deepStrictEqual(res.body.enrollment.completedLessonIds, ['l1']);

    // video first, then the quiz
    const second = learner(6);
    res = await watch(second, 'l1', 30, 60);
    assert.deepStrictEqual(res.body.enrollment.completedLessonIds, []);
    assert.deepStrictEqual(res.body.enrollment.lessonProgress.l1, { watchedSeconds: 30, durationSeconds: 60, quizAnswered: false });
    res = await quiz(second, 'l1');
    assert.deepStrictEqual(res.body.enrollment.completedLessonIds, ['l1']);
  });
});

test('a YouTube link cannot be timed, so only its quiz (if any) counts', async () => {
  const yt = await prisma.course.create({
    data: {
      title: 'Linked course', description: 'Lessons from before uploads', isPublished: true,
      modules: [{
        id: 'ym', title: 'Links', order: 1,
        lessons: [
          { id: 'y1', title: 'Link', order: 1, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          { id: 'y2', title: 'Link with quiz', order: 2, videoUrl: 'https://youtu.be/dQw4w9WgXcQ', quiz: { title: 'Q', questions: [{ question: 'a?', options: ['x', 'y'], correctAnswer: 0 }] } },
          { id: 'y3', title: 'Direct file', order: 3, videoUrl: 'https://cdn.example.com/lesson.mp4' }
        ]
      }]
    }
  });
  const user = learner(7);
  const shown = (await call(controller.getCourse, { user, params: { id: yt.id } })).body.course.modules[0].lessons;
  assert.deepStrictEqual(shown.map((l) => l.watchRequired), [false, false, true]);

  assert.strictEqual((await watch(user, 'y1', 10, 100, yt.id)).statusCode, 400);
  assert.deepStrictEqual((await progressCall(controller.markProgress, user, 'y1', {}, yt.id)).body.enrollment.completedLessonIds, ['y1']); // opened

  const open = await progressCall(controller.markProgress, user, 'y2', {}, yt.id);
  assert.strictEqual(open.statusCode, 400);
  assert.match(open.body.error, /submit the quiz/);
  const answered = await progressCall(controller.submitQuiz, user, 'y2', { body: { answers: [0] } }, yt.id);
  assert.deepStrictEqual(answered.body.enrollment.completedLessonIds, ['y1', 'y2']);

  assert.strictEqual((await watch(user, 'y3', 10, 100, yt.id)).statusCode, 200); // a direct file is timed
});

// A signed link as the service builds it: the policy is the URL with the expiry, signed with RSA-SHA1 and
// written in CloudFront's URL-safe base64.
function checkSignedLink(link, expectedKey) {
  const url = new URL(link);
  assert.strictEqual(url.host, 'cdn.test.invalid');
  assert.strictEqual(url.pathname, `/${expectedKey}`);
  assert.strictEqual(url.searchParams.get('Key-Pair-Id'), 'KTESTKEYID');
  const expires = Number(url.searchParams.get('Expires'));
  const left = expires - Math.floor(Date.now() / 1000);
  assert.ok(left > 3 * 3600 && left <= 4 * 3600, `expires in about 4 hours, got ${left}s`);
  const policy = JSON.stringify({ Statement: [{ Resource: `https://cdn.test.invalid/${expectedKey}`, Condition: { DateLessThan: { 'AWS:EpochTime': expires } } }] });
  const signature = url.searchParams.get('Signature').replace(/-/g, '+').replace(/_/g, '=').replace(/~/g, '/');
  assert.strictEqual(crypto.createVerify('RSA-SHA1').update(policy).verify(publicKey, signature, 'base64'), true, 'the signature must verify');
}

test('a lesson document opens through a CloudFront signed link, never the raw bucket URL', async () => {
  const docs = await prisma.course.create({
    data: {
      title: 'Docs course', description: 'Reference documents', isPublished: true,
      modules: [{
        id: 'dm', title: 'Docs', order: 1,
        lessons: [
          // what the admin portal saves today: a key, plus the bucket URL without a signature (a private bucket refuses it)
          { id: 'd1', title: 'Key', order: 1, documentKey: 'course-documents/1700000000000-ab12cd.pdf', documentUrl: 'https://test-bucket.s3.ap-south-1.amazonaws.com/course-documents/1700000000000-ab12cd.pdf', documentName: 'notes.pdf' },
          // an older lesson that kept only the bucket URL
          { id: 'd2', title: 'Old', order: 2, documentUrl: 'https://test-bucket.s3.ap-south-1.amazonaws.com/course-documents/1600000000000-ef34ab.pdf' },
          { id: 'd3', title: 'External', order: 3, documentUrl: 'https://example.com/guide.pdf' },
          { id: 'd4', title: 'Unsafe', order: 4, documentUrl: 'javascript:alert(1)' },
          { id: 'd5', title: 'None', order: 5 }
        ]
      }]
    }
  });
  const ask = (lessonId) => call(controller.getLessonDocument, { user: student, params: { id: docs.id, lessonId } });

  const byKey = await ask('d1');
  assert.strictEqual(byKey.body.success, true);
  checkSignedLink(byKey.body.documentUrl, 'course-documents/1700000000000-ab12cd.pdf');
  assert.strictEqual(byKey.body.documentUrl.includes('amazonaws.com'), false);

  checkSignedLink((await ask('d2')).body.documentUrl, 'course-documents/1600000000000-ef34ab.pdf');

  assert.strictEqual((await ask('d3')).body.documentUrl, 'https://example.com/guide.pdf');
  assert.strictEqual((await ask('d4')).statusCode, 404);
  assert.strictEqual((await ask('d5')).statusCode, 404);
  assert.strictEqual((await ask('nope')).statusCode, 404);
  assert.strictEqual((await call(controller.getLessonDocument, { user: student, params: { id: hidden.id, lessonId: 'lx' } })).statusCode, 404);

  // the course the candidate opens only says which lessons have a document
  const shown = (await call(controller.getCourse, { user: student, params: { id: docs.id } })).body.course.modules[0].lessons;
  assert.deepStrictEqual(shown.map((l) => l.hasDocument), [true, true, true, false, false]); // the unsafe link and the missing one do not advertise a document
  assert.strictEqual(JSON.stringify(shown).includes('course-documents'), false);
  assert.strictEqual(shown[0].documentName, 'notes.pdf');
});

test('only signed-in candidates reach lessons', () => {
  const router = require('../../src/modules/courses/course.routes');
  const guarded = router.stack.filter((layer) => layer.route.path !== '/');
  assert.strictEqual(guarded.length, 6);
  guarded.forEach((layer) => assert.ok(layer.route.stack.length >= 3, `${layer.route.path} needs auth and the candidate check`));
  const candidateOnly = router.stack[1].route.stack[1].handle;
  const res = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  candidateOnly({ user: { id: 'r', role: 'RECRUITER' } }, res, () => assert.fail('recruiter passed'));
  assert.strictEqual(res.statusCode, 403);
});
