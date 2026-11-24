const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { relaxedLimit } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const recruiterController = require('./recruiter.controller');
const {
  verifyCompanySchema,
  postJobSchema,
  eligibleCountSchema,
  updateJobSchema,
  toggleJobStatusSchema,
  deleteJobSchema,
  updateApplicationRoundsSchema,
  candidateSearchSchema,
  candidateIdSchema
} = require('./recruiter.validator');
const { updateCompanySchema, updateCompanyPhotosSchema } = require('./recruiterCompany.validator');
const { requireRecruiter, requireApprovedRecruiter } = require('./companyVerification');

// Recruiter Company, Jobs, and Candidate Review Routes
router.get('/company', authMiddleware, relaxedLimit, requireRecruiter, recruiterController.getCompany);
router.put('/company', authMiddleware, relaxedLimit, requireRecruiter, validate(updateCompanySchema), recruiterController.updateCompany);
router.put('/company/photos', authMiddleware, relaxedLimit, requireRecruiter, validate(updateCompanyPhotosSchema), recruiterController.updateCompanyPhotos);
router.get('/companies/:companyId', authMiddleware, relaxedLimit, recruiterController.getCompanyById);
router.post('/verify', authMiddleware, relaxedLimit, requireRecruiter, validate(verifyCompanySchema), recruiterController.verifyCompany);
router.post('/jobs', authMiddleware, relaxedLimit, requireApprovedRecruiter, validate(postJobSchema), recruiterController.postJob);
// Count of candidates who meet a draft job's skill bars (no candidate data returned)
router.post('/jobs/eligible-count', authMiddleware, relaxedLimit, requireApprovedRecruiter, validate(eligibleCountSchema), recruiterController.getEligibleCandidateCount);
router.put('/jobs/:jobId', authMiddleware, relaxedLimit, requireRecruiter, validate(updateJobSchema), recruiterController.updateJob);
router.patch('/jobs/:jobId/status', authMiddleware, relaxedLimit, requireRecruiter, validate(toggleJobStatusSchema), recruiterController.toggleJobPause);
router.delete('/jobs/:jobId', authMiddleware, relaxedLimit, requireRecruiter, validate(deleteJobSchema), recruiterController.deleteJob);
router.get('/jobs', authMiddleware, relaxedLimit, requireRecruiter, recruiterController.getCompanyJobs);
// Candidates: one page of cards per search, the filter menus, and one full profile.
router.post('/candidates/search', authMiddleware, relaxedLimit, requireApprovedRecruiter, validate(candidateSearchSchema), recruiterController.searchCandidates);
router.get('/candidates/facets', authMiddleware, relaxedLimit, requireApprovedRecruiter, recruiterController.getCandidateFacets);
router.get('/candidates/:candidateId', authMiddleware, relaxedLimit, requireApprovedRecruiter, validate(candidateIdSchema), recruiterController.getCandidateDetail);
router.put('/applications/:applicationId/rounds', authMiddleware, relaxedLimit, requireApprovedRecruiter, validate(updateApplicationRoundsSchema), recruiterController.updateApplicationRounds);

module.exports = router;
