const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { relaxedLimit } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const supportController = require('./support.controller');
const { createTicketSchema, replySchema } = require('./support.validator');

// Help & support (candidates and recruiters; the controller refuses other roles).
// Ticket creation is also capped by the number of unresolved tickets (supportRules LIMITS).

// The signed-in user's tickets with their conversations, and the topics they can pick
router.get('/tickets', authMiddleware, relaxedLimit, supportController.listTickets);

// Raise a ticket; emails the requester a confirmation
router.post('/tickets', authMiddleware, relaxedLimit, validate(createTicketSchema), supportController.createTicket);

// Add a message to one's own ticket (reopens a resolved ticket)
router.post('/tickets/:ticketId/messages', authMiddleware, relaxedLimit, validate(replySchema), supportController.replyToTicket);

module.exports = router;
