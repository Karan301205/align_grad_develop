const express = require('express');
const authMiddleware = require('../../middleware/auth');
const courseController = require('./course.controller');

const router = express.Router();

// Courses are written in the admin portal (admin_ws); this API only serves them.
// Lessons, video streams, documents, watch time, progress and quizzes are for signed-in candidates.
const candidateOnly = (req, res, next) =>
  req.user?.role === 'STUDENT' ? next() : res.status(403).json({ success: false, error: 'Courses are for candidates.' });
const candidate = [authMiddleware, candidateOnly];

router.get('/', courseController.listCourses);
router.get('/:id', candidate, courseController.getCourse);
router.get('/:id/lessons/:lessonId/stream', candidate, courseController.getLessonStream);
router.get('/:id/lessons/:lessonId/document', candidate, courseController.getLessonDocument);
router.post('/:id/lessons/:lessonId/watch', candidate, courseController.reportWatch);
router.post('/:id/lessons/:lessonId/complete', candidate, courseController.markProgress);
router.post('/:id/lessons/:lessonId/quiz', candidate, courseController.submitQuiz);

module.exports = router;
