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

// A lesson as candidates get it: no S3 keys or raw video URL (the video comes from
// the signed stream) and no quiz answers or explanations (see scoreQuiz).
function publicLesson(lesson) {
  const { videoKey, videoUrl, documentKey, quiz, ...rest } = lesson;
  const questions = quizQuestions(lesson);
  return {
    ...rest,
    hasVideo: Boolean(String(videoKey || '').trim() || videoUrl),
    quiz: questions.length ? { title: quiz.title || '', questions: questions.map((q) => ({ question: q.question, options: q.options || [] })) } : null
  };
}

async function findLesson(courseId, lessonId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  const lesson = course && course.isPublished !== false ? lessonsOf(course).find((item) => item.id === lessonId) : null;
  if (!lesson) throw httpError(404, 'This lesson isn’t available.');
  return { course, lesson };
}

async function markLessonProgress(userId, courseId, lessonId) {
  await findLesson(courseId, lessonId);
  const where = { userId_courseId: { userId, courseId } };
  const current = await prisma.courseEnrollment.findUnique({ where });
  const done = current?.completedLessonIds || [];
  const completedLessonIds = done.includes(lessonId) ? done : [...done, lessonId];
  return prisma.courseEnrollment.upsert({
    where,
    create: { userId, courseId, completedLessonIds, lastAccessedLessonId: lessonId },
    update: { completedLessonIds, lastAccessedLessonId: lessonId }
  });
}

module.exports = {
  getCloudFrontSignedUrl,
  markLessonProgress,

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
      enrollment: { completedLessonIds: enrollment?.completedLessonIds || [], lastAccessedLessonId: enrollment?.lastAccessedLessonId || null }
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
   * Scores a lesson quiz on the server (practice: it completes the lesson whatever the
   * score). Every question must be answered. Returns the right answers and explanations
   * so the candidate can review them.
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
    const enrollment = await markLessonProgress(userId, courseId, lessonId);
    return { correct, total: questions.length, results, enrollment };
  }
};
