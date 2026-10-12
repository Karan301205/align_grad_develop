const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const courseController = require('./course.controller');

// Middleware to extract optional user token without failing if absent
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  return authMiddleware(req, res, next);
};

// --- Student / Public Routes ---
router.get('/', courseController.listCourses);
router.get('/:id', optionalAuth, courseController.getCourse);
router.get('/:id/lessons/:lessonId/stream', optionalAuth, courseController.getLessonStream);
router.post('/:id/lessons/:lessonId/complete', authMiddleware, courseController.markProgress);

// --- Admin Management Routes ---
router.get('/admin/all', courseController.listAdminCourses);
router.post('/admin/upload-url', courseController.getUploadPresignedUrl);
router.post('/admin', courseController.createCourse);
router.put('/admin/:id', courseController.updateCourse);
router.delete('/admin/:id', courseController.deleteCourse);

// Module management
router.post('/admin/:id/modules', courseController.addModule);
router.put('/admin/:id/modules/:moduleId', courseController.updateModule);
router.delete('/admin/:id/modules/:moduleId', courseController.deleteModule);

// Lesson management
router.post('/admin/:id/modules/:moduleId/lessons', courseController.addLesson);
router.put('/admin/:id/modules/:moduleId/lessons/:lessonId', courseController.updateLesson);
router.delete('/admin/:id/modules/:moduleId/lessons/:lessonId', courseController.deleteLesson);

module.exports = router;
