const express = require('express');
const router = express.Router();
const recruiterController = require('../controllers/recruiter.controller');

router.get('/', recruiterController.getAllRecruiters);

module.exports = router;
