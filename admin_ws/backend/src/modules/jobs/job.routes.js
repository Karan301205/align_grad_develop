const express = require('express');
const router = express.Router();
const jobController = require('./job.controller');
const validate = require('../../middleware/validate');
const { getJobApplicantsSchema } = require('./job.validator');

router.get('/', jobController.getAllJobs);
router.get('/:jobId/applicants', validate(getJobApplicantsSchema), jobController.getJobApplicants);

module.exports = router;
