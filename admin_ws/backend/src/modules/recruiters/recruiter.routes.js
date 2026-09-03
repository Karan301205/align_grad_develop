const express = require('express');
const router = express.Router();
const recruiterController = require('./recruiter.controller');

router.get('/', recruiterController.getAllRecruiters);

module.exports = router;
