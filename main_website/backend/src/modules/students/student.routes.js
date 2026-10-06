const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { relaxedLimit } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const studentController = require('./student.controller');
const {
  updateProfileSchema,
  applyJobSchema,
  submitTestSchema,
  generateTestSchema,
  submitSkillTestSchema,
  saveIntroVideoSchema
} = require('./student.validator');

// Student Profile & Opportunities Routes
router.get('/profile', authMiddleware, relaxedLimit, studentController.getProfile);
router.get('/check-username', authMiddleware, relaxedLimit, studentController.checkUsername);
router.put('/profile', authMiddleware, relaxedLimit, validate(updateProfileSchema), studentController.updateProfile);
// Public Job Brief Route (no login required for shared links)
router.get('/jobs/:jobId/public', relaxedLimit, studentController.getPublicJobBrief);

router.get('/jobs', authMiddleware, relaxedLimit, studentController.getJobs);
router.post('/jobs/:jobId/apply', authMiddleware, relaxedLimit, validate(applyJobSchema), studentController.applyJob);
router.post('/tests', authMiddleware, relaxedLimit, validate(submitTestSchema), studentController.submitTest);
router.get('/tests/skills', authMiddleware, relaxedLimit, studentController.getTechnicalSkills);
router.post('/tests/generate', authMiddleware, relaxedLimit, validate(generateTestSchema), studentController.generateSkillTest);
router.post('/tests/submit', authMiddleware, relaxedLimit, validate(submitSkillTestSchema), studentController.submitSkillTest);
router.get('/applications', authMiddleware, relaxedLimit, studentController.getStudentApplications);
router.post('/intro-video', authMiddleware, relaxedLimit, validate(saveIntroVideoSchema), studentController.saveIntroVideo);
router.post('/video-upload-url', authMiddleware, relaxedLimit, studentController.requestVideoUploadUrl);

module.exports = router;
