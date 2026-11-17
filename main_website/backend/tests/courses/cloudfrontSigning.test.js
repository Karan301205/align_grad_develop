// How the course API signs CloudFront links, and what it does when it can't. Lesson videos and documents
// sit behind CloudFront, which refuses an unsigned link (403 MissingKey). The private key file is
// gitignored, so a server deployed from git had none, and the API quietly handed out unsigned links:
// every lesson video failed to play. Now the key can also be given as text in CLOUDFRONT_PRIVATE_KEY,
// and without a usable key, key ID or domain the API answers an error instead of a link that can't work.
// The settings are read on each request, so each test sets its own. Runs on the test store.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const test = require('node:test');
const assert = require('node:assert');

// a throwaway key, never a real one
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs1', format: 'pem' });
const keyFile = path.join(os.tmpdir(), `cloudfront-signing-test-${process.pid}.pem`);
fs.writeFileSync(keyFile, pem);
process.on('exit', () => fs.rmSync(keyFile, { force: true }));
process.env.S3_BUCKET_NAME = 'test-bucket';

const { prisma, isMock } = require('../../src/infrastructure/database');
const controller = require('../../src/modules/courses/course.controller');

const student = { id: 'cc0000000000000000000099', role: 'STUDENT' };
let course;

// Answers as Express would: json() for success and 4xx, next(err) for anything else (errorHandler then
// answers err.status with a plain message).
const call = (handler, req) =>
  new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; resolve(this); return this; }
    };
    handler(req, res, (err) => resolve({ statusCode: err.status || 500, error: err }));
  });
const stream = () => call(controller.getLessonStream, { user: student, params: { id: course.id, lessonId: 'v1' } });
const doc = () => call(controller.getLessonDocument, { user: student, params: { id: course.id, lessonId: 'v1' } });

function settings({ key, keyPath, keyId = 'KTESTKEYID', domain = 'cdn.test.invalid' } = {}) {
  const values = { CLOUDFRONT_PRIVATE_KEY: key, CLOUDFRONT_PRIVATE_KEY_PATH: keyPath, CLOUDFRONT_KEY_ID: keyId, CLOUDFRONT_DOMAIN: domain };
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

function assertSigned(link, key) {
  const url = new URL(link);
  assert.strictEqual(url.host, 'cdn.test.invalid');
  assert.strictEqual(url.pathname, `/${key}`);
  assert.strictEqual(url.searchParams.get('Key-Pair-Id'), 'KTESTKEYID');
  const expires = Number(url.searchParams.get('Expires'));
  const policy = JSON.stringify({ Statement: [{ Resource: `https://cdn.test.invalid/${key}`, Condition: { DateLessThan: { 'AWS:EpochTime': expires } } }] });
  const signature = url.searchParams.get('Signature').replace(/-/g, '+').replace(/_/g, '=').replace(/~/g, '/');
  assert.strictEqual(crypto.createVerify('RSA-SHA1').update(policy).verify(publicKey, signature, 'base64'), true, 'the signature must verify');
}

test('setup', async () => {
  assert.strictEqual(isMock(), true);
  course = await prisma.course.create({
    data: {
      title: 'Signed links', description: 'One lesson with a video and a document', isPublished: true,
      modules: [{ id: 'm', title: 'Week 1', order: 1, lessons: [{ id: 'v1', title: 'Video', order: 1, videoKey: 'courses/v.mp4', documentKey: 'course-documents/v.pdf' }] }]
    }
  });
});

test('a key file named by CLOUDFRONT_PRIVATE_KEY_PATH signs the video and document links', async () => {
  settings({ keyPath: keyFile });
  assertSigned((await stream()).body.streamUrl, 'courses/v.mp4');
  assertSigned((await doc()).body.documentUrl, 'course-documents/v.pdf');
});

test('the key can be given as text in CLOUDFRONT_PRIVATE_KEY, with newlines written as \\n', async () => {
  settings({ key: pem.trim().replace(/\n/g, '\\n') }); // one line, as an env box takes it
  assertSigned((await stream()).body.streamUrl, 'courses/v.mp4');
  settings({ key: pem }); // real newlines
  assertSigned((await stream()).body.streamUrl, 'courses/v.mp4');
  settings({ key: pem, keyPath: path.join(os.tmpdir(), 'no-such-cloudfront-key.pem') }); // the text wins over a path
  assertSigned((await stream()).body.streamUrl, 'courses/v.mp4');
});

test('without a usable key, key ID or domain the API answers an error, never a link CloudFront refuses', async () => {
  const broken = [
    {}, // no key configured at all
    { keyPath: path.join(os.tmpdir(), 'no-such-cloudfront-key.pem') },
    { key: 'not a key' },
    { keyPath: keyFile, keyId: '' },
    { keyPath: keyFile, domain: '' }
  ];
  for (const setup of broken) {
    settings(setup);
    const video = await stream();
    assert.strictEqual(video.statusCode, 503, `stream with ${JSON.stringify(setup)}`);
    assert.strictEqual(video.body, undefined, 'no link is sent');
    assert.match(video.error.message, /CloudFront signing is not set up/);
    assert.strictEqual((await doc()).statusCode, 503, `document with ${JSON.stringify(setup)}`);
  }
  // the key that a broken setup failed on is picked up once it is there, without a restart
  settings({ keyPath: keyFile });
  assertSigned((await stream()).body.streamUrl, 'courses/v.mp4');
});
