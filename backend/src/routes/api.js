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
const { updateCompanySchema } = require('../validators/recruiterCompany.validator');
const {
  createGigSchema,
  applyGigSchema,
  sendMessageSchema,
  submitWorkSchema,
  reviewGigSchema,
  updateGigSchema
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
router.put('/recruiter/company', authMiddleware, relaxedLimit, validate(updateCompanySchema), recruiterController.updateCompany);
router.get('/recruiter/companies/:companyId', authMiddleware, relaxedLimit, recruiterController.getCompanyById);
router.post('/recruiter/verify', authMiddleware, relaxedLimit, validate(verifyCompanySchema), recruiterController.verifyCompany);
router.post('/recruiter/jobs', authMiddleware, relaxedLimit, validate(postJobSchema), recruiterController.postJob);
router.put('/recruiter/jobs/:jobId', authMiddleware, relaxedLimit, validate(updateJobSchema), recruiterController.updateJob);
router.delete('/recruiter/jobs/:jobId', authMiddleware, relaxedLimit, validate(deleteJobSchema), recruiterController.deleteJob);
router.get('/recruiter/jobs', authMiddleware, relaxedLimit, recruiterController.getCompanyJobs);
router.get('/recruiter/candidates', authMiddleware, relaxedLimit, recruiterController.getCandidates);
router.put('/recruiter/applications/:applicationId/rounds', authMiddleware, relaxedLimit, validate(updateApplicationRoundsSchema), recruiterController.updateApplicationRounds);

const communityController = require('../controllers/community.controller');
const {
  createCommunitySchema,
  joinCommunitySchema,
  createInviteSchema,
  createPostSchema,
  editPostSchema,
  reactPostSchema,
  createCommentSchema,
  requestMediaUrlSchema
} = require('../validators/community.validator');

// Gigs Marketplace routes (protected)
router.get('/gigs', authMiddleware, relaxedLimit, gigController.getGigs);
router.post('/gigs', authMiddleware, relaxedLimit, validate(createGigSchema), gigController.createGig);
router.put('/gigs/:gigId', authMiddleware, relaxedLimit, validate(updateGigSchema), gigController.updateGig);
router.patch('/gigs/:gigId/status', authMiddleware, relaxedLimit, gigController.updateGigStatus);
router.delete('/gigs/:gigId', authMiddleware, relaxedLimit, gigController.deleteGig);
router.get('/gigs/my-gigs', authMiddleware, relaxedLimit, gigController.getMyGigs);
router.get('/gigs/:gigId', authMiddleware, relaxedLimit, gigController.getGigDetails);
router.post('/gigs/:gigId/apply', authMiddleware, relaxedLimit, validate(applyGigSchema), gigController.applyToGig);
router.post('/gigs/:gigId/hire', authMiddleware, relaxedLimit, gigController.hireCandidate);
router.post('/gigs/:gigId/messages', authMiddleware, relaxedLimit, validate(sendMessageSchema), gigController.sendMessage);
router.post('/gigs/:gigId/submit', authMiddleware, relaxedLimit, validate(submitWorkSchema), gigController.submitWork);
router.post('/gigs/:gigId/complete', authMiddleware, relaxedLimit, gigController.completeGig);
router.post('/gigs/:gigId/review', authMiddleware, relaxedLimit, validate(reviewGigSchema), gigController.reviewGig);

// Community System routes (protected)
router.get('/community', authMiddleware, relaxedLimit, communityController.getCommunities);
router.get('/community/search', authMiddleware, relaxedLimit, communityController.searchCommunities);
router.post('/community', authMiddleware, relaxedLimit, validate(createCommunitySchema), communityController.createCommunity);
router.post('/community/:id/join', authMiddleware, relaxedLimit, validate(joinCommunitySchema), communityController.joinCommunity);
router.delete('/community/:id', authMiddleware, relaxedLimit, communityController.deleteCommunity);
router.post('/community/:id/invite', authMiddleware, relaxedLimit, validate(createInviteSchema), communityController.createInviteLink);
router.post('/community/invite/:token/join', authMiddleware, relaxedLimit, communityController.joinViaInvite);

// Community Feed & Post routes
router.get('/community/:id/feed', authMiddleware, relaxedLimit, communityController.getCommunityFeed);
router.post('/community/:id/posts', authMiddleware, relaxedLimit, validate(createPostSchema), communityController.createPost);
router.put('/community/posts/:postId', authMiddleware, relaxedLimit, validate(editPostSchema), communityController.editPost);
router.delete('/community/posts/:postId', authMiddleware, relaxedLimit, communityController.deletePost);

// Community Media presigned upload URL route
router.post('/community/media/upload-url', authMiddleware, relaxedLimit, validate(requestMediaUrlSchema), communityController.requestMediaUploadUrl);

// Community Engagement routes
router.post('/community/posts/:postId/react', authMiddleware, relaxedLimit, validate(reactPostSchema), communityController.toggleReaction);
router.get('/community/posts/:postId/comments', authMiddleware, relaxedLimit, communityController.getPostComments);
router.post('/community/posts/:postId/comments', authMiddleware, relaxedLimit, validate(createCommentSchema), communityController.addComment);
router.delete('/community/comments/:commentId', authMiddleware, relaxedLimit, communityController.deleteComment);
router.post('/community/posts/:postId/bookmark', authMiddleware, relaxedLimit, communityController.toggleBookmark);
router.get('/community/bookmarks', authMiddleware, relaxedLimit, communityController.getSavedPosts);
router.post('/community/posts/:postId/view', authMiddleware, relaxedLimit, communityController.recordView);

module.exports = router;
