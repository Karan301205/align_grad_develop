// Videos go straight to S3; the server then checks the stored file (uploads/directUpload.js).
// S3 is never called: the storage functions are replaced.
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.AWS_REGION = 'test-region-1';

const test = require('node:test');
const assert = require('node:assert');
const s3 = require('../../src/infrastructure/storage/s3');
const { startVideoUpload, checkUploadedFile, UploadProblem } = require('../../src/modules/uploads/directUpload');

const MB = 1024 * 1024;
const MP4_START = Buffer.from('000000186674797069736f6d0000020069736f6d', 'hex'); // ....ftypisom
const deleted = [];
s3.deleteObject = async (key) => { deleted.push(key); };
s3.createUploadPost = async (key, contentType, maxBytes) => ({ url: 'https://test-bucket.s3.amazonaws.com/', fields: { key, 'Content-Type': contentType, maxBytes: String(maxBytes) } });

const stored = (head, start = MP4_START) => {
  s3.headObject = async () => head;
  s3.readObjectStart = async () => start;
};

test('the upload form is for one key in the owner\'s videos folder, with the size limit', async () => {
  const result = await startVideoUpload({ folderId: 'p1', fileType: 'projectVideo', fileName: 'demo.MOV', contentType: 'video/quicktime', now: 42 });
  assert.strictEqual(result.key, 'videos/p1/proj_42.mov');
  assert.strictEqual(result.maxBytes, 100 * MB);
  assert.strictEqual(result.upload.fields['Content-Type'], 'video/quicktime');
  assert.strictEqual(result.publicUrl, 'https://test-bucket.s3.test-region-1.amazonaws.com/videos/p1/proj_42.mov');

  const odd = await startVideoUpload({ folderId: 'p1', fileType: 'video', fileName: 'x.mp4/../../evil', contentType: 'video/mp4; codecs=avc1', now: 7 });
  assert.strictEqual(odd.key, 'videos/p1/showcase_7.mp4', 'a strange extension is replaced');

  await assert.rejects(startVideoUpload({ folderId: 'p1', fileType: 'video', fileName: 'a.html', contentType: 'text/html' }), UploadProblem);
});

test('a real video within the limit passes the check and is kept', async () => {
  deleted.length = 0;
  stored({ ContentLength: 5 * MB, ContentType: 'video/mp4' });
  assert.strictEqual(await checkUploadedFile('videos/p1/showcase_1.mp4', 'video'), null);
  assert.deepStrictEqual(deleted, []);
});

test('a file that is too big, the wrong type or not a video is deleted', async () => {
  for (const [head, start, message] of [
    [{ ContentLength: 51 * MB, ContentType: 'video/mp4' }, MP4_START, /50 MB or smaller/],
    [{ ContentLength: MB, ContentType: 'text/html' }, MP4_START, /MP4, MOV or WebM/],
    [{ ContentLength: MB, ContentType: 'video/mp4' }, Buffer.from('<html><body>hi</body>'), /isn’t a video/]
  ]) {
    deleted.length = 0;
    stored(head, start);
    const problem = await checkUploadedFile('videos/p1/showcase_2.mp4', 'video');
    assert.strictEqual(problem.status, 400);
    assert.match(problem.error, message);
    assert.deepStrictEqual(deleted, ['videos/p1/showcase_2.mp4']);
  }
});

test('a missing file is reported; other storage errors are thrown', async () => {
  s3.headObject = async () => { throw Object.assign(new Error('not found'), { name: 'NotFound' }); };
  assert.strictEqual((await checkUploadedFile('videos/p1/none.mp4', 'video')).status, 404);
  s3.headObject = async () => { throw Object.assign(new Error('denied'), { name: 'AccessDenied' }); };
  await assert.rejects(checkUploadedFile('videos/p1/none.mp4', 'video'), /denied/);
});
