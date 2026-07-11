const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storage.controller');

router.get('/explorer', storageController.getStorageDetails);

module.exports = router;
