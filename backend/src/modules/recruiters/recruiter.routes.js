const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { relaxedLimit } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const recruiterController = require('./recruiter.controller');
const {
  verifyCompanySchema,
  postJobSchema,
  updateJobSchema,
  toggleJobStatusSchema,
  deleteJobSchema,
  updateApplicationRoundsSchema
} = require('./recruiter.validator');
const { updateCompanySchema } = require('./recruiterCompany.validator');

// Recruiter Company, Jobs, and Candidate Review Routes
router.get('/company', authMiddleware, relaxedLimit, recruiterController.getCompany);
router.put('/company', authMiddleware, relaxedLimit, validate(updateCompanySchema), recruiterController.updateCompany);
router.get('/companies/:companyId', authMiddleware, relaxedLimit, recruiterController.getCompanyById);
router.post('/verify', authMiddleware, relaxedLimit, validate(verifyCompanySchema), recruiterController.verifyCompany);
router.post('/jobs', authMiddleware, relaxedLimit, validate(postJobSchema), recruiterController.postJob);
router.put('/jobs/:jobId', authMiddleware, relaxedLimit, validate(updateJobSchema), recruiterController.updateJob);
router.patch('/jobs/:jobId/status', authMiddleware, relaxedLimit, validate(toggleJobStatusSchema), recruiterController.toggleJobPause);
router.delete('/jobs/:jobId', authMiddleware, relaxedLimit, validate(deleteJobSchema), recruiterController.deleteJob);
router.get('/jobs', authMiddleware, relaxedLimit, recruiterController.getCompanyJobs);
router.get('/candidates', authMiddleware, relaxedLimit, recruiterController.getCandidates);
router.get('/top-talents', authMiddleware, relaxedLimit, recruiterController.getTopMatchingTalents);
router.put('/applications/:applicationId/rounds', authMiddleware, relaxedLimit, validate(updateApplicationRoundsSchema), recruiterController.updateApplicationRounds);

module.exports = router;
