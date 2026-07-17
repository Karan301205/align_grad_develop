const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { rateLimiter, checkLoginLock } = require('../middleware/rateLimiter');
const rateLimitConfig = require('../config/rateLimit.config');
const validate = require('../middleware/validate');

// Validator schemas
const { signupSchema, loginSchema } = require('../validators/auth.validator');
const {
  updateProfileSchema,
  applyJobSchema,
  submitTestSchema,
  generateTestSchema,
  submitSkillTestSchema,
  saveIntroVideoSchema,
  parseResumeSchema
} = require('../validators/student.validator');
const {
  verifyCompanySchema,
  postJobSchema,
  updateJobSchema,
  deleteJobSchema,
  updateApplicationRoundsSchema
} = require('../validators/recruiter.validator');
const { requestUploadUrlSchema } = require('../validators/upload.validator');
const {
  createGigSchema,
  applyGigSchema,
  sendMessageSchema,
  submitWorkSchema,
  reviewGigSchema
} = require('../validators/gig.validator');

const authController = require('../controllers/auth.controller');
const studentController = require('../controllers/student.controller');
const recruiterController = require('../controllers/recruiter.controller');
const uploadController = require('../controllers/upload.controller');
const gigController = require('../controllers/gig.controller');

// Middlewares for different scopes
const authLimit = rateLimiter(rateLimitConfig.auth);
const relaxedLimit = rateLimiter(rateLimitConfig.relaxed);

// Public Auth routes
router.post('/auth/signup', authLimit, validate(signupSchema), authController.signup);
router.post('/auth/login', authLimit, checkLoginLock, validate(loginSchema), authController.login);

// Student routes (protected)
router.get('/student/profile', authMiddleware, relaxedLimit, studentController.getProfile);
router.get('/student/check-username', authMiddleware, relaxedLimit, studentController.checkUsername);
router.put('/student/profile', authMiddleware, relaxedLimit, validate(updateProfileSchema), studentController.updateProfile);
router.get('/student/jobs', authMiddleware, relaxedLimit, studentController.getJobs);
router.post('/student/jobs/:jobId/apply', authMiddleware, relaxedLimit, validate(applyJobSchema), studentController.applyJob);
router.post('/student/tests', authMiddleware, relaxedLimit, validate(submitTestSchema), studentController.submitTest);
router.get('/student/tests/skills', authMiddleware, relaxedLimit, studentController.getTechnicalSkills);
router.post('/student/tests/generate', authMiddleware, relaxedLimit, validate(generateTestSchema), studentController.generateSkillTest);
router.post('/student/tests/submit', authMiddleware, relaxedLimit, validate(submitSkillTestSchema), studentController.submitSkillTest);
router.get('/student/applications', authMiddleware, relaxedLimit, studentController.getStudentApplications);
router.post('/student/intro-video', authMiddleware, relaxedLimit, validate(saveIntroVideoSchema), studentController.saveIntroVideo);
router.post('/student/video-upload-url', authMiddleware, relaxedLimit, studentController.requestVideoUploadUrl);
router.post('/student/resume/parse', authMiddleware, relaxedLimit, validate(parseResumeSchema), studentController.parseUploadedResume);

// Upload routes (protected)
router.post('/upload/request-url', authMiddleware, relaxedLimit, validate(requestUploadUrlSchema), uploadController.requestUploadUrl);
router.put('/upload/secure-put', authMiddleware, uploadController.securePut);

// Recruiter routes (protected)
router.get('/recruiter/company', authMiddleware, relaxedLimit, recruiterController.getCompany);
router.post('/recruiter/verify', authMiddleware, relaxedLimit, validate(verifyCompanySchema), recruiterController.verifyCompany);
router.post('/recruiter/jobs', authMiddleware, relaxedLimit, validate(postJobSchema), recruiterController.postJob);
router.put('/recruiter/jobs/:jobId', authMiddleware, relaxedLimit, validate(updateJobSchema), recruiterController.updateJob);
router.delete('/recruiter/jobs/:jobId', authMiddleware, relaxedLimit, validate(deleteJobSchema), recruiterController.deleteJob);
router.get('/recruiter/jobs', authMiddleware, relaxedLimit, recruiterController.getCompanyJobs);
router.get('/recruiter/candidates', authMiddleware, relaxedLimit, recruiterController.getCandidates);
router.put('/recruiter/applications/:applicationId/rounds', authMiddleware, relaxedLimit, validate(updateApplicationRoundsSchema), recruiterController.updateApplicationRounds);

// Gigs Marketplace routes (protected)
router.get('/gigs', authMiddleware, relaxedLimit, gigController.getGigs);
router.post('/gigs', authMiddleware, relaxedLimit, validate(createGigSchema), gigController.createGig);
router.get('/gigs/my-gigs', authMiddleware, relaxedLimit, gigController.getMyGigs);
router.get('/gigs/:gigId', authMiddleware, relaxedLimit, gigController.getGigDetails);
router.post('/gigs/:gigId/apply', authMiddleware, relaxedLimit, validate(applyGigSchema), gigController.applyToGig);
router.post('/gigs/:gigId/hire', authMiddleware, relaxedLimit, gigController.hireCandidate);
router.post('/gigs/:gigId/messages', authMiddleware, relaxedLimit, validate(sendMessageSchema), gigController.sendMessage);
router.post('/gigs/:gigId/submit', authMiddleware, relaxedLimit, validate(submitWorkSchema), gigController.submitWork);
router.post('/gigs/:gigId/complete', authMiddleware, relaxedLimit, gigController.completeGig);
router.post('/gigs/:gigId/review', authMiddleware, relaxedLimit, validate(reviewGigSchema), gigController.reviewGig);

module.exports = router;
