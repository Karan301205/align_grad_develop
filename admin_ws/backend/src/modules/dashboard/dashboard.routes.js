const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');

router.get('/stats', dashboardController.getStats);
router.get('/opportunities', dashboardController.getOpportunityMetrics);

module.exports = router;
