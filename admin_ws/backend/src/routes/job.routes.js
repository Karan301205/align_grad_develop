const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const validate = require('../middleware/validate');
const { getJobApplicantsSchema } = require('../validators/job.validator');

router.get('/', jobController.getAllJobs);
router.get('/:jobId/applicants', validate(getJobApplicantsSchema), jobController.getJobApplicants);

module.exports = router;
