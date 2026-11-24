const database = require('../../config/database');
const { normalizeId } = require('../../utils/ids');
const mailer = require('../../config/mailer');
const {
  TICKET_STATUS,
  MESSAGE_AUTHOR,
  formatTicketSummary,
  formatTicketDetail,
  countByStatus,
  statusAfterAdminReply,
  requesterName
} = require('./supportTickets');
const { buildReplyEmail, buildResolvedEmail } = require('./supportEmail');

// Help & support tickets raised in main_website (tables "SupportTicket" and
// "SupportMessage", see main_website/backend/prisma/schema.prisma). Admins read the
// conversation, reply (which emails the requester), resolve and reopen.

// A ticket with its requester and latest message. "Profile" and "Company" are unique
// per user, so the joins add at most one row each.
const TICKET_SELECT = `
  SELECT t."id", t."number", t."userId", t."role", t."category", t."subject", t."status",
         t."lastMessageAt", t."resolvedAt", t."createdAt",
         u."email",
         p."name" AS "profileName",
         c."name" AS "companyName",
         c."recruiterName",
         (SELECT count(*) FROM "SupportMessage" mc WHERE mc."ticketId" = t."id")::int AS "messageCount",
         lm."author" AS "lastAuthor",
         lm."body" AS "lastBody"
    FROM "SupportTicket" t
    JOIN "User" u ON u."id" = t."userId"
    LEFT JOIN "Profile" p ON p."userId" = t."userId"
    LEFT JOIN "Company" c ON c."userId" = t."userId"
    LEFT JOIN LATERAL (
      SELECT m."author", m."body"
        FROM "SupportMessage" m
       WHERE m."ticketId" = t."id"
       ORDER BY m."createdAt" DESC, m."id" DESC
       LIMIT 1
    ) lm ON true`;

async function loadTicket(db, ticketId) {
  const { rows: [row] } = await db.query(`${TICKET_SELECT} WHERE t."id" = $1`, [ticketId]);
  if (!row) return null;
  const { rows: messages } = await db.query(
    'SELECT "id", "author", "body", "createdAt" FROM "SupportMessage" WHERE "ticketId" = $1 ORDER BY "createdAt", "id"',
    [ticketId]
  );
  return { row, ticket: formatTicketDetail(row, messages) };
}

// Sends one email to the requester. The change is already saved when this runs, so a
// failure is reported to the admin (emailSent: false) instead of undoing it.
async function notifyRequester(row, template) {
  if (!row.email) return { emailSent: false, emailError: 'This account has no email address.' };
  try {
    await mailer.sendMail({ to: row.email, ...template });
    return { emailSent: true, emailError: null };
  } catch (mailErr) {
    console.error('[AdminMailer] Failed to send a support ticket email:', mailErr.message);
    return { emailSent: false, emailError: mailErr.message };
  }
}

const STALE_MESSAGE = 'The requester has written again since you opened this ticket. Read the new message first; your reply is still in the box.';

/** True when the admin acted on an older view of the conversation than the one stored. */
function isStale(ticket, seenLastMessageAt) {
  if (!seenLastMessageAt) return false;
  return new Date(ticket.lastMessageAt).getTime() !== new Date(seenLastMessageAt).getTime();
}

// Runs `work(client)` in one transaction on a dedicated connection.
async function inTransaction(db, work) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// GET /api/support/tickets: every ticket (no conversations), most recent activity first,
// with counts per status.
exports.listTickets = async (req, res, next) => {
  try {
    const db = database.getDB();
    const { rows } = await db.query(`${TICKET_SELECT} ORDER BY t."lastMessageAt" DESC, t."number" DESC`);
    const tickets = rows.map(formatTicketSummary);
    res.json({ success: true, tickets, counts: countByStatus(tickets) });
  } catch (err) {
    next(err);
  }
};

// GET /api/support/tickets/:ticketId: one ticket with its whole conversation.
exports.getTicket = async (req, res, next) => {
  try {
    const loaded = await loadTicket(database.getDB(), normalizeId(req.params.ticketId));
    if (!loaded) return res.status(404).json({ success: false, error: 'Ticket not found' });
    res.json({ success: true, ticket: loaded.ticket });
  } catch (err) {
    next(err);
  }
};

// POST /api/support/tickets/:ticketId/reply { message, resolve? }: adds the admin's
// reply, sets the ticket to PENDING (waiting on the requester) or RESOLVED, and emails
// the reply to the requester.
exports.replyToTicket = async (req, res, next) => {
  try {
    const db = database.getDB();
    const ticketId = normalizeId(req.params.ticketId);
    const { message, resolve, seenLastMessageAt } = req.body;

    const outcome = await inTransaction(db, async (client) => {
      // Locks the ticket so a reply, a status change and the requester's own message can't interleave.
      const { rows: [ticket] } = await client.query('SELECT "id", "lastMessageAt" FROM "SupportTicket" WHERE "id" = $1 FOR UPDATE', [ticketId]);
      if (!ticket) return 'missing';
      if (isStale(ticket, seenLastMessageAt)) return 'stale';
      const now = new Date();
      const status = statusAfterAdminReply(resolve);
      await client.query(
        'INSERT INTO "SupportMessage" ("ticketId", "author", "body", "createdAt") VALUES ($1, $2, $3, $4)',
        [ticketId, MESSAGE_AUTHOR.ADMIN, message, now]
      );
      await client.query(
        `UPDATE "SupportTicket"
            SET "status" = $1, "lastMessageAt" = $2, "resolvedAt" = $3, "updatedAt" = $2
          WHERE "id" = $4`,
        [status, now, status === TICKET_STATUS.RESOLVED ? now : null, ticketId]
      );
      return 'saved';
    });
    if (outcome === 'missing') return res.status(404).json({ success: false, error: 'Ticket not found' });
    if (outcome === 'stale') return res.status(409).json({ success: false, stale: true, error: STALE_MESSAGE });

    const { row, ticket } = await loadTicket(db, ticketId);
    const email = await notifyRequester(
      row,
      buildReplyEmail({
        name: requesterName(row),
        role: row.role,
        number: row.number,
        subject: row.subject,
        reply: message,
        resolved: ticket.status === TICKET_STATUS.RESOLVED
      })
    );
    res.status(201).json({ success: true, ticket, ...email });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/support/tickets/:ticketId/status { status }: resolve (emails the
// requester), reopen, or mark as waiting on the requester (no email).
exports.updateTicketStatus = async (req, res, next) => {
  try {
    const db = database.getDB();
    const ticketId = normalizeId(req.params.ticketId);
    const { status, seenLastMessageAt } = req.body;

    const outcome = await inTransaction(db, async (client) => {
      const { rows: [ticket] } = await client.query('SELECT "id", "status", "lastMessageAt" FROM "SupportTicket" WHERE "id" = $1 FOR UPDATE', [ticketId]);
      if (!ticket) return 'missing';
      if (isStale(ticket, seenLastMessageAt)) return 'stale';
      if (ticket.status === status) return 'unchanged';
      const now = new Date();
      await client.query(
        'UPDATE "SupportTicket" SET "status" = $1, "resolvedAt" = $2, "updatedAt" = $3 WHERE "id" = $4',
        [status, status === TICKET_STATUS.RESOLVED ? now : null, now, ticketId]
      );
      return 'changed';
    });
    if (outcome === 'missing') return res.status(404).json({ success: false, error: 'Ticket not found' });
    if (outcome === 'stale') return res.status(409).json({ success: false, stale: true, error: STALE_MESSAGE });
    if (outcome === 'unchanged') {
      return res.status(409).json({ success: false, error: 'The ticket already has this status. Refresh to see the latest.' });
    }

    const { row, ticket } = await loadTicket(db, ticketId);
    let email = { emailSent: null, emailError: null }; // no email for reopening or "waiting on requester"
    if (status === TICKET_STATUS.RESOLVED) {
      email = await notifyRequester(
        row,
        buildResolvedEmail({ name: requesterName(row), role: row.role, number: row.number, subject: row.subject })
      );
    }
    res.json({ success: true, ticket, ...email });
  } catch (err) {
    next(err);
  }
};
