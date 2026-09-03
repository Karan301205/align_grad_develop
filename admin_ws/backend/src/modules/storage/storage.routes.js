const express = require('express');
const router = express.Router();
const storageController = require('./storage.controller');

router.get('/explorer', storageController.getStorageDetails);

module.exports = router;
