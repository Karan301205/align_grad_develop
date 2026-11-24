const express = require('express');
const router = express.Router();
const supportController = require('./support.controller');
const validate = require('../../middleware/validate');
const { ticketIdSchema, replySchema, statusSchema } = require('./support.validator');

router.get('/tickets', supportController.listTickets);
router.get('/tickets/:ticketId', validate(ticketIdSchema), supportController.getTicket);
router.post('/tickets/:ticketId/reply', validate(replySchema), supportController.replyToTicket);
router.patch('/tickets/:ticketId/status', validate(statusSchema), supportController.updateTicketStatus);

module.exports = router;
