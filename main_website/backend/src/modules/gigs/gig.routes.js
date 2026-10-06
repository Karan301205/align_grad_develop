const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { relaxedLimit } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const gigController = require('./gig.controller');
const {
  createGigSchema,
  updateGigSchema,
  applyGigSchema,
  sendMessageSchema,
  submitWorkSchema,
  reviewGigSchema
} = require('./gig.validator');

// Gigs Marketplace Routes
router.get('/', authMiddleware, relaxedLimit, gigController.getGigs);
router.post('/', authMiddleware, relaxedLimit, validate(createGigSchema), gigController.createGig);
router.put('/:gigId', authMiddleware, relaxedLimit, validate(updateGigSchema), gigController.updateGig);
router.patch('/:gigId/status', authMiddleware, relaxedLimit, gigController.updateGigStatus);
router.delete('/:gigId', authMiddleware, relaxedLimit, gigController.deleteGig);
router.get('/my-gigs', authMiddleware, relaxedLimit, gigController.getMyGigs);
router.get('/:gigId', authMiddleware, relaxedLimit, gigController.getGigDetails);
router.post('/:gigId/apply', authMiddleware, relaxedLimit, validate(applyGigSchema), gigController.applyToGig);
router.post('/:gigId/hire', authMiddleware, relaxedLimit, gigController.hireCandidate);
router.post('/:gigId/reject', authMiddleware, relaxedLimit, gigController.rejectCandidate);
router.post('/:gigId/messages', authMiddleware, relaxedLimit, validate(sendMessageSchema), gigController.sendMessage);
router.post('/:gigId/submit', authMiddleware, relaxedLimit, validate(submitWorkSchema), gigController.submitWork);
router.post('/:gigId/complete', authMiddleware, relaxedLimit, gigController.completeGig);
router.post('/:gigId/review', authMiddleware, relaxedLimit, validate(reviewGigSchema), gigController.reviewGig);

module.exports = router;
