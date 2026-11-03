const express = require('express');
const router = express.Router();
const recruiterController = require('./recruiter.controller');
const validate = require('../../middleware/validate');
const { reviewVerificationSchema } = require('./recruiter.validator');

router.get('/', recruiterController.getAllRecruiters);
router.patch('/:recruiterId/verification', validate(reviewVerificationSchema), recruiterController.reviewRecruiterVerification);

module.exports = router;
