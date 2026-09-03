const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');

router.get('/stats', dashboardController.getStats);

module.exports = router;
