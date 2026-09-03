const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');

router.get('/', analyticsController.getAnalytics);

module.exports = router;
