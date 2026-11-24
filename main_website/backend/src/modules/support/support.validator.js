const { z } = require('zod');
const { LIMITS } = require('./supportRules');

// middleware/validate.js reads schema.body / .params / .query, so each schema is a
// plain object (a bare z.object would be skipped silently; ISSUES A7).

// Trimmed free text. NUL characters are dropped first: PostgreSQL TEXT can't store them.
const text = (min, max, tooShort, tooLong) =>
  z
    .string({ error: tooShort })
    .transform((value) => value.replace(/\u0000/g, '').trim())
    .pipe(z.string().min(min, tooShort).max(max, tooLong));

const ticketIdParams = z.object({
  ticketId: z.string().regex(/^[0-9a-f]{24}$/i, 'Ticket not found.')
});

const createTicketSchema = {
  body: z.object({
    // Checked against the requester's role in the controller.
    category: z.string({ error: 'Choose a topic.' }).trim().min(1, 'Choose a topic.').max(40, 'Choose a topic from the list.'),
    subject: text(
      LIMITS.subjectMin,
      LIMITS.subjectMax,
      `Give your ticket a subject of at least ${LIMITS.subjectMin} characters.`,
      `Keep the subject under ${LIMITS.subjectMax} characters.`
    ),
    message: text(
      LIMITS.messageMin,
      LIMITS.messageMax,
      `Describe the problem in at least ${LIMITS.messageMin} characters.`,
      `Keep the description under ${LIMITS.messageMax} characters.`
    )
  })
};

const replySchema = {
  params: ticketIdParams,
  body: z.object({
    message: text(
      LIMITS.replyMin,
      LIMITS.messageMax,
      'Write a reply first.',
      `Keep your reply under ${LIMITS.messageMax} characters.`
    )
  })
};

module.exports = {
  createTicketSchema,
  replySchema
};
