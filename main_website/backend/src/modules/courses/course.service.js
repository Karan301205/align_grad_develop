const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { prisma } = require('../../infrastructure/database');
const env = require('../../config/env');

// Courses are written by the admin portal (admin_ws). This service only serves them
// to candidates: published courses, lessons without S3 keys or quiz answers, signed
// video streams, progress and quiz scoring.

// CloudFront Configuration
const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN || ''; // no hardcoded fallback
const cloudfrontKeyId = process.env.CLOUDFRONT_KEY_ID || ''; // no hardcoded fallback
if (!cloudfrontDomain || !cloudfrontKeyId) {
  console.warn('[config] CLOUDFRONT_DOMAIN / CLOUDFRONT_KEY_ID not set — course video streaming will fail.');
}

// Ownership check built from env (S3_BUCKET_NAME) — no hardcoded bucket.
function isOwnS3Url(url) {
  return Boolean(url && env.S3_BUCKET_NAME && url.includes(`${env.S3_BUCKET_NAME}.s3.`));
}
const configuredPrivateKeyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH || '../../cloudfront_private_key.pem';

let cachedPrivateKey = null;

function getPrivateKey() {
  if (cachedPrivateKey) return cachedPrivateKey;

  // Try configured path relative to project root or backend
  const candidates = [
    path.resolve(__dirname, '../../..', configuredPrivateKeyPath),
    path.resolve(__dirname, '../../../..', 'cloudfront_private_key.pem'),
    path.resolve(process.cwd(), 'cloudfront_private_key.pem'),
    path.resolve(process.cwd(), '../cloudfront_private_key.pem'),
    path.resolve(process.cwd(), '../../cloudfront_private_key.pem')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        cachedPrivateKey = fs.readFileSync(candidate, 'utf8');
        return cachedPrivateKey;
      } catch (e) {
        console.warn(`[CloudFront] Could not read private key from ${candidate}:`, e.message);
      }
    }
  }

  return null;
}

function toBase64Url(str) {
  return str.replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');
}

/**
 * Generates a signed CloudFront playback URL for a given S3 video key.
 * @param {string} videoKey S3 object key
 * @param {number} expiresInSeconds Lifetime in seconds (default 4 hours)
 */
function getCloudFrontSignedUrl(videoKey, expiresInSeconds = 4 * 3600) {
  if (!videoKey) return null;

  // Clean key in case it includes leading slashes or full URL
  let cleanKey = videoKey.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '');
  const targetUrl = `https://${cloudfrontDomain}/${cleanKey}`;
  const expiresEpoch = Math.floor((Date.now() + expiresInSeconds * 1000) / 1000);

  const privateKey = getPrivateKey();
  if (!privateKey || !cloudfrontKeyId) {
    console.warn('[CloudFront Warning] Private key or Key-Pair-Id missing, falling back to unsigned URL');
    return targetUrl;
  }

  try {
    const cannedPolicy = JSON.stringify({
      Statement: [
        {
          Resource: targetUrl,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': expiresEpoch
            }
          }
        }
      ]
    });

    const sign = crypto.createSign('RSA-SHA1');
    sign.update(cannedPolicy);
    const signature = toBase64Url(sign.sign(privateKey, 'base64'));

    return `${targetUrl}?Expires=${expiresEpoch}&Signature=${signature}&Key-Pair-Id=${cloudfrontKeyId}`;
  } catch (err) {
    console.error('[CloudFront Signer Error]:', err.message);
    return targetUrl;
  }
}

const httpError = (status, message) => Object.assign(new Error(message), { status });
const byOrder = (items) => [...(items || [])].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
const lessonsOf = (course) => (course.modules || []).flatMap((mod) => mod.lessons || []);
const quizQuestions = (lesson) => (Array.isArray(lesson?.quiz?.questions) ? lesson.quiz.questions : []);

// --- When a lesson is complete ------------------------------------------------------------------
// A lesson is complete when everything it asks for is done:
//   - its uploaded video: at least half of the video's length has been watched. The server adds up
//     the watch time the player reports, so it is time actually played that counts: skipping ahead,
//     starting from the middle or jumping to the end makes no difference.
//   - its quiz: submitted (every question answered; practice, so the score doesn't matter).
// A lesson with neither (no uploaded video and no quiz, or only a YouTube link, whose playback
// can't be counted) is complete once it is opened.
const WATCHED_TO_COMPLETE = 0.5;
const MAX_REPORT_SECONDS = 30; // the most watch time one report can add
const SPEED_ALLOWANCE = 2.5; // media seconds that can be played per real second (2x speed, plus slack)
const MAX_VIDEO_SECONDS = 12 * 3600;
const YOUTUBE_LINK = /(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([A-Za-z0-9_-]{11})/;

// An uploaded video (ours or a direct link): the only kind whose playback the server can count.
function hasCountableVideo(lesson) {
  if (String(lesson?.videoKey || '').trim()) return true;
  const url = String(lesson?.videoUrl || '').trim();
  return Boolean(url) && !YOUTUBE_LINK.test(url);
}
const hasQuiz = (lesson) => quizQuestions(lesson).length > 0;

const progressOf = (enrollment, lessonId) => ({ watchedSeconds: 0, durationSeconds: 0, quizAnswered: false, ...(enrollment?.lessonProgress?.[lessonId] || {}) });

function isLessonDone(lesson, progress) {
  const watched = !hasCountableVideo(lesson) || (progress.durationSeconds > 0 && progress.watchedSeconds >= progress.durationSeconds * WATCHED_TO_COMPLETE);
  const quizzed = !hasQuiz(lesson) || progress.quizAnswered;
  return watched && quizzed;
}

// An enrollment as candidates get it: what is done and how far each lesson is (no server timestamps).
function publicEnrollment(enrollment) {
  const lessonProgress = {};
  for (const [id, p] of Object.entries(enrollment?.lessonProgress || {})) {
    lessonProgress[id] = { watchedSeconds: Math.floor(Number(p.watchedSeconds) || 0), durationSeconds: Number(p.durationSeconds) || 0, quizAnswered: Boolean(p.quizAnswered) };
  }
  return { completedLessonIds: enrollment?.completedLessonIds || [], lastAccessedLessonId: enrollment?.lastAccessedLessonId || null, lessonProgress };
}

// The key of a lesson's reference document in our bucket: the stored key, else the key inside its S3
// URL (the stored URL has no signature, so on its own it is refused by the private bucket). '' for an
// external link or no document.
function documentKeyOf(lesson) {
  const key = String(lesson.documentKey || '').trim();
  if (key) return key;
  return isOwnS3Url(lesson.documentUrl) ? (lesson.documentUrl.split('.amazonaws.com/')[1] || '').split('?')[0] : '';
}
const isWebLink = (value) => /^https?:\/\//i.test(String(value || '').trim());
// A document the candidate can actually open: one of ours, or an external web link.
const hasDocument = (lesson) => Boolean(documentKeyOf(lesson) || isWebLink(lesson.documentUrl));

// A lesson as candidates get it: no S3 keys or raw video / document URLs (the video comes from the
// signed stream, the document from its signed link) and no quiz answers or explanations (see scoreQuiz).
function publicLesson(lesson) {
  const { videoKey, videoUrl, documentKey, documentUrl, quiz, ...rest } = lesson;
  const questions = quizQuestions(lesson);
  return {
    ...rest,
    hasVideo: Boolean(String(videoKey || '').trim() || videoUrl),
    watchRequired: hasCountableVideo(lesson),
    hasDocument: hasDocument(lesson),
    quiz: questions.length ? { title: quiz.title || '', questions: questions.map((q) => ({ question: q.question, options: q.options || [] })) } : null
  };
}

async function findLesson(courseId, lessonId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  const lesson = course && course.isPublished !== false ? lessonsOf(course).find((item) => item.id === lessonId) : null;
  if (!lesson) throw httpError(404, 'This lesson isn’t available.');
  return { course, lesson };
}

// Saves a change to one lesson's progress and marks the lesson done once everything it asks for is done.
async function recordProgress(userId, courseId, lesson, change) {
  const where = { userId_courseId: { userId, courseId } };
  const current = await prisma.courseEnrollment.findUnique({ where });
  const done = current?.completedLessonIds || [];
  const progress = { ...progressOf(current, lesson.id), ...change(progressOf(current, lesson.id)) };
  const lessonProgress = { ...(current?.lessonProgress || {}), [lesson.id]: progress };
  const completedLessonIds = done.includes(lesson.id) || !isLessonDone(lesson, progress) ? done : [...done, lesson.id];
  const saved = await prisma.courseEnrollment.upsert({
    where,
    create: { userId, courseId, completedLessonIds, lessonProgress, lastAccessedLessonId: lesson.id },
    update: { completedLessonIds, lessonProgress, lastAccessedLessonId: lesson.id }
  });
  return publicEnrollment(saved);
}

// "Opened": completes a lesson that asks for nothing (see the rules above). A lesson with a video
// to watch or a quiz to submit is refused, so the API can't be used to skip them.
async function markLessonProgress(userId, courseId, lessonId) {
  const { lesson } = await findLesson(courseId, lessonId);
  const asks = [hasCountableVideo(lesson) && 'watch half of the video', hasQuiz(lesson) && 'submit the quiz'].filter(Boolean);
  if (asks.length > 0) {
    const current = await prisma.courseEnrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if ((current?.completedLessonIds || []).includes(lessonId)) return publicEnrollment(current); // done earlier
    throw httpError(400, `To finish this lesson, ${asks.join(' and ')}.`);
  }
  return recordProgress(userId, courseId, lesson, () => ({}));
}

/**
 * Adds watch time reported by the player: `seconds` of the video played since its last report and the
 * video's length. One report adds at most MAX_REPORT_SECONDS and no more than the real time since the
 * last report allows (SPEED_ALLOWANCE), so the number can't simply be claimed.
 */
async function reportWatchTime(userId, courseId, lessonId, { seconds, duration } = {}) {
  const { lesson } = await findLesson(courseId, lessonId);
  if (!hasCountableVideo(lesson)) throw httpError(400, 'This lesson has no video to time.');
  const played = Number(seconds);
  const length = Number(duration);
  if (!Number.isFinite(played) || played < 0 || !Number.isFinite(length) || length < 1 || length > MAX_VIDEO_SECONDS) {
    throw httpError(400, 'Send the seconds watched and the length of the video.');
  }
  const now = Date.now();
  return recordProgress(userId, courseId, lesson, (progress) => {
    const since = progress.lastReportAt ? Math.max(0, (now - Date.parse(progress.lastReportAt)) / 1000) : MAX_REPORT_SECONDS;
    const credit = Math.min(played, MAX_REPORT_SECONDS, since * SPEED_ALLOWANCE + 1);
    return { watchedSeconds: progress.watchedSeconds + credit, durationSeconds: Math.round(length), lastReportAt: new Date(now).toISOString() };
  });
}

module.exports = {
  getCloudFrontSignedUrl,
  markLessonProgress,
  reportWatchTime,

  /** Published courses for the catalog (no lessons, just how many). */
  async listCourses() {
    const courses = await prisma.course.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } });
    return courses.map(({ modules, thumbnailKey, ...course }) => ({ ...course, lessonCount: lessonsOf({ modules }).length }));
  },

  /** A published course with its modules and lessons in order, and the candidate's progress. */
  async getCourseById(id, userId) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course || course.isPublished === false) throw httpError(404, 'This course isn’t available.');
    const enrollment = await prisma.courseEnrollment.findUnique({ where: { userId_courseId: { userId, courseId: id } } });
    const { thumbnailKey, ...rest } = course;
    return {
      ...rest,
      modules: byOrder(course.modules).map((mod) => ({ ...mod, lessons: byOrder(mod.lessons).map(publicLesson) })),
      enrollment: publicEnrollment(enrollment)
    };
  },

  /** The lesson's video: a CloudFront signed URL for our S3 uploads, else the stored URL, else null. */
  async getLessonStreamUrl(courseId, lessonId) {
    const { lesson } = await findLesson(courseId, lessonId);
    let streamUrl = null;
    if (String(lesson.videoKey || '').trim()) {
      streamUrl = getCloudFrontSignedUrl(lesson.videoKey);
    } else if (lesson.videoUrl) {
      const key = isOwnS3Url(lesson.videoUrl) ? lesson.videoUrl.split('.amazonaws.com/')[1] : '';
      streamUrl = key ? getCloudFrontSignedUrl(key) : lesson.videoUrl;
    }
    return { streamUrl };
  },

  /**
   * The lesson's reference document: a CloudFront signed URL for our S3 uploads (the bucket is private, so the
   * stored URL alone is refused), else an external http(s) link as stored. 404 when there is none.
   */
  async getLessonDocumentUrl(courseId, lessonId) {
    const { lesson } = await findLesson(courseId, lessonId);
    const key = documentKeyOf(lesson);
    const documentUrl = key ? getCloudFrontSignedUrl(key) : isWebLink(lesson.documentUrl) ? String(lesson.documentUrl).trim() : null;
    if (!documentUrl) throw httpError(404, 'This lesson has no document.');
    return { documentUrl };
  },

  /**
   * Scores a lesson quiz on the server (practice: submitting it counts as answered whatever the
   * score; the lesson is complete once its video is watched too). Every question must be
   * answered. Returns the right answers and explanations so the candidate can review them.
   */
  async scoreQuiz(userId, courseId, lessonId, answers) {
    const { lesson } = await findLesson(courseId, lessonId);
    const questions = quizQuestions(lesson);
    if (questions.length === 0) throw httpError(400, 'This lesson has no quiz.');
    const valid = Array.isArray(answers) && answers.length === questions.length &&
      answers.every((answer, i) => Number.isInteger(answer) && answer >= 0 && answer < (questions[i].options || []).length);
    if (!valid) throw httpError(400, `Answer all ${questions.length} questions to submit.`);
    const results = questions.map((q) => ({ correctAnswer: Number(q.correctAnswer), explanation: q.explanation || '' }));
    const correct = results.filter((result, i) => result.correctAnswer === answers[i]).length;
    const enrollment = await recordProgress(userId, courseId, lesson, () => ({ quizAnswered: true }));
    return { correct, total: questions.length, results, enrollment };
  }
};
