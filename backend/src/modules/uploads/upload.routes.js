const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { relaxedLimit } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const uploadController = require('./upload.controller');
const { requestUploadUrlSchema } = require('./upload.validator');

// File Upload Routes
router.post('/request-url', authMiddleware, relaxedLimit, validate(requestUploadUrlSchema), uploadController.requestUploadUrl);
router.put('/secure-put', authMiddleware, uploadController.securePut);

module.exports = router;
