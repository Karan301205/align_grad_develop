const { z } = require('zod');
const { ID_REGEX } = require('../../utils/ids');
const { STATUSES } = require('./supportTickets');

// Same limit as main_website/backend/src/modules/support/supportRules.js (messageMax).
const MESSAGE_MAX = 5000;

const ticketParams = z.object({
  ticketId: z.string().regex(ID_REGEX, 'Invalid ticket ID')
});

const ticketIdSchema = { params: ticketParams };

// The ticket's lastMessageAt as the admin's screen shows it. When the requester has
// written since, the change is refused (409) so nobody answers or resolves a ticket
// over a message they haven't read. Optional for older clients.
const seenLastMessageAt = z.iso.datetime({ offset: true, error: 'seenLastMessageAt must be an ISO date' }).optional();

const replySchema = {
  params: ticketParams,
  body: z.object({
    // NUL characters are dropped: PostgreSQL TEXT can't store them.
    message: z
      .string({ error: 'Write a reply first' })
      .transform((value) => value.replace(/\u0000/g, '').trim())
      .pipe(z.string().min(2, 'Write a reply first').max(MESSAGE_MAX, `Keep the reply under ${MESSAGE_MAX} characters`)),
    resolve: z.boolean().optional().default(false),
    seenLastMessageAt
  })
};

const statusSchema = {
  params: ticketParams,
  body: z.object({
    status: z.enum(STATUSES, { error: `status must be one of ${STATUSES.join(', ')}` }),
    seenLastMessageAt
  })
};

module.exports = {
  ticketIdSchema,
  replySchema,
  statusSchema
};
