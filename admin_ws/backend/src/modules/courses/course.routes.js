const express = require('express');
const router = express.Router();
const courseController = require('./course.controller');

router.get('/', courseController.getAllCourses);
router.post('/upload-url', courseController.getUploadUrl);
router.get('/:id', courseController.getCourseById);
router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

// Modules
router.post('/:id/modules', courseController.addModule);
router.put('/:id/modules/:moduleId', courseController.updateModule);
router.delete('/:id/modules/:moduleId', courseController.deleteModule);

// Lessons
router.post('/:id/modules/:moduleId/lessons', courseController.addLesson);
router.put('/:id/modules/:moduleId/lessons/:lessonId', courseController.updateLesson);
router.delete('/:id/modules/:moduleId/lessons/:lessonId', courseController.deleteLesson);

module.exports = router;
