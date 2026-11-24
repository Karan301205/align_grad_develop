const { prisma } = require('../../infrastructure/database');
const email = require('../../infrastructure/email');
const { sendError } = require('../../shared/http/sendError');
const {
  TICKET_STATUS,
  UNRESOLVED_STATUSES,
  MESSAGE_AUTHOR,
  LIMITS,
  isSupportRole,
  categoriesFor,
  isValidCategory,
  categoryLabel,
  toRequesterTicket,
  byRecentActivity
} = require('./supportRules');
const { buildTicketReceivedEmail } = require('./supportEmail');

// Help & support for candidates and recruiters (GET/POST /support/tickets,
// POST /support/tickets/:ticketId/messages). Every query is scoped to the signed-in
// user, so nobody can read or add to someone else's ticket. Admin replies are
// written by admin_ws (modules/support), which also emails them.

const WITH_MESSAGES = { messages: { orderBy: { createdAt: 'asc' } } };

function rejectOtherRoles(req, res) {
  if (isSupportRole(req.user?.role)) return false;
  res.status(403).json({ error: 'Help & support is for candidate and recruiter accounts.' });
  return true;
}

/** Account email and the name to greet: the candidate's profile name, or the recruiter's (or company) name. */
async function requesterContact(userId, role) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  let name = '';
  if (role === 'RECRUITER') {
    const company = await prisma.company.findUnique({ where: { userId } });
    name = company?.recruiterName || company?.name || '';
  } else {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    name = profile?.name || '';
  }
  return { email: user.email, name };
}

// GET /support/tickets: the signed-in user's tickets with their conversations,
// most recent activity first, plus the topics they can file under.
exports.listTickets = async (req, res) => {
  if (rejectOtherRoles(req, res)) return undefined;
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      include: WITH_MESSAGES
    });
    return res.json({
      tickets: tickets.map(toRequesterTicket).sort(byRecentActivity),
      categories: categoriesFor(req.user.role),
      limits: LIMITS
    });
  } catch (err) {
    return sendError(res, err, 500, 'Could not load your support tickets');
  }
};

// POST /support/tickets { category, subject, message }: raises a ticket and emails
// the requester a confirmation. The ticket is kept even if the email fails; the
// response says so (`emailSent: false`) and the app tells the user.
exports.createTicket = async (req, res) => {
  if (rejectOtherRoles(req, res)) return undefined;
  const { id: userId, role } = req.user;
  const { category, subject, message } = req.body;
  try {
    if (!isValidCategory(role, category)) {
      return res.status(400).json({ error: 'Choose a topic from the list.' });
    }

    const unresolved = await prisma.supportTicket.count({
      where: { userId, status: { in: UNRESOLVED_STATUSES } }
    });
    if (unresolved >= LIMITS.maxOpenTickets) {
      return res.status(409).json({
        error: `You already have ${unresolved} open tickets. Add to one of them, or wait until we resolve one.`
      });
    }

    const now = new Date();
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        role,
        category,
        subject,
        status: TICKET_STATUS.OPEN,
        lastMessageAt: now,
        messages: { create: [{ author: MESSAGE_AUTHOR.USER, body: message, createdAt: now }] }
      },
      include: WITH_MESSAGES
    });

    let emailSent = false;
    try {
      const contact = await requesterContact(userId, role);
      if (contact?.email) {
        const mail = buildTicketReceivedEmail({
          name: contact.name,
          role,
          number: ticket.number,
          subject,
          categoryLabel: categoryLabel(role, category),
          message
        });
        await email.sendMail({ to: contact.email, ...mail });
        emailSent = true;
      }
    } catch (mailErr) {
      console.error(`[support] Ticket ${ticket.id} was saved, but the confirmation email failed:`, mailErr.message);
    }

    return res.status(201).json({ ticket: toRequesterTicket(ticket), emailSent });
  } catch (err) {
    return sendError(res, err, 500, 'Could not raise your ticket');
  }
};

// POST /support/tickets/:ticketId/messages { message }: the requester adds to their
// own ticket. The ticket goes back to OPEN (waiting on AlignGrad), which also reopens
// a resolved one.
exports.replyToTicket = async (req, res) => {
  if (rejectOtherRoles(req, res)) return undefined;
  const { ticketId } = req.params;
  try {
    const ticket = await prisma.supportTicket.findFirst({ where: { id: ticketId, userId: req.user.id } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const now = new Date();
    const [, updated] = await prisma.$transaction([
      prisma.supportMessage.create({
        data: { ticketId, author: MESSAGE_AUTHOR.USER, body: req.body.message, createdAt: now }
      }),
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: TICKET_STATUS.OPEN, resolvedAt: null, lastMessageAt: now },
        include: WITH_MESSAGES
      })
    ]);

    return res.status(201).json({
      ticket: toRequesterTicket(updated),
      reopened: ticket.status === TICKET_STATUS.RESOLVED
    });
  } catch (err) {
    return sendError(res, err, 500, 'Could not send your reply');
  }
};
