// Help & support: the rules shared by the support endpoints (pure, no database).
//
// A ticket's `status` moves like this:
//   OPEN      waiting on AlignGrad (new ticket, or the requester added a message)
//   PENDING   AlignGrad replied and is waiting on the requester (set by admin_ws)
//   RESOLVED  closed by AlignGrad (admin_ws); a new message from the requester reopens it
//
// admin_ws/backend/src/modules/support/supportTickets.js keeps a copy of the statuses,
// authors and category labels (admin_ws must not import from main_website). Keep both
// in sync, and the category list in main_website/frontend comes from GET /support/tickets.

const TICKET_STATUS = Object.freeze({ OPEN: 'OPEN', PENDING: 'PENDING', RESOLVED: 'RESOLVED' });
const UNRESOLVED_STATUSES = [TICKET_STATUS.OPEN, TICKET_STATUS.PENDING];
const MESSAGE_AUTHOR = Object.freeze({ USER: 'USER', ADMIN: 'ADMIN' });
const SUPPORT_ROLES = ['STUDENT', 'RECRUITER'];

const LIMITS = Object.freeze({
  subjectMin: 5,
  subjectMax: 120,
  messageMin: 10, // the first message, which describes the problem
  replyMin: 2,
  messageMax: 5000,
  // Unresolved (OPEN or PENDING) tickets one person may have at once. Each new ticket
  // sends an email, so this also caps how many a single account can trigger.
  maxOpenTickets: 5
});

// Topics a requester can file under, per role (key → label shown to people).
const CATEGORIES = Object.freeze({
  STUDENT: [
    { key: 'ACCOUNT', label: 'Account and sign-in' },
    { key: 'PROFILE', label: 'My profile' },
    { key: 'JOBS', label: 'Jobs and applications' },
    { key: 'TESTS', label: 'Skill tests' },
    { key: 'GIGS', label: 'Gigs' },
    { key: 'COURSES', label: 'Courses' },
    { key: 'PAYMENTS', label: 'Payments' },
    { key: 'OTHER', label: 'Something else' }
  ],
  RECRUITER: [
    { key: 'ACCOUNT', label: 'Account and sign-in' },
    { key: 'VERIFICATION', label: 'Company verification' },
    { key: 'JOBS', label: 'Job posts and applicants' },
    { key: 'CANDIDATES', label: 'Finding candidates' },
    { key: 'GIGS', label: 'Gigs' },
    { key: 'PAYMENTS', label: 'Payments and job credits' },
    { key: 'OTHER', label: 'Something else' }
  ]
});

const isSupportRole = (role) => SUPPORT_ROLES.includes(role);

const categoriesFor = (role) => CATEGORIES[role] || [];

const isValidCategory = (role, key) => categoriesFor(role).some((category) => category.key === key);

function categoryLabel(role, key) {
  const match = categoriesFor(role).find((category) => category.key === key);
  return match ? match.label : 'Something else';
}

/** "SUP-12": how a ticket is named to people (emails, both apps). */
const ticketReference = (number) => `SUP-${number}`;

const toIso = (value) => (value ? new Date(value).toISOString() : null);

function byCreatedAt(a, b) {
  return new Date(a.createdAt) - new Date(b.createdAt);
}

/** The ticket as the requester sees it: their own conversation, oldest message first. */
function toRequesterTicket(ticket) {
  const messages = [...(ticket.messages || [])].sort(byCreatedAt).map((message) => ({
    id: message.id,
    author: message.author === MESSAGE_AUTHOR.ADMIN ? MESSAGE_AUTHOR.ADMIN : MESSAGE_AUTHOR.USER,
    body: message.body,
    createdAt: toIso(message.createdAt)
  }));
  return {
    id: ticket.id,
    number: ticket.number,
    reference: ticketReference(ticket.number),
    category: ticket.category,
    categoryLabel: categoryLabel(ticket.role, ticket.category),
    subject: ticket.subject,
    status: TICKET_STATUS[ticket.status] || TICKET_STATUS.OPEN,
    createdAt: toIso(ticket.createdAt),
    lastMessageAt: toIso(ticket.lastMessageAt || ticket.createdAt),
    resolvedAt: toIso(ticket.resolvedAt),
    messages
  };
}

/** Most recent activity first; ties fall back to the newer ticket number. */
function byRecentActivity(a, b) {
  const diff = new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt);
  return diff !== 0 ? diff : (b.number || 0) - (a.number || 0);
}

module.exports = {
  TICKET_STATUS,
  UNRESOLVED_STATUSES,
  MESSAGE_AUTHOR,
  SUPPORT_ROLES,
  LIMITS,
  CATEGORIES,
  isSupportRole,
  categoriesFor,
  isValidCategory,
  categoryLabel,
  ticketReference,
  toRequesterTicket,
  byRecentActivity
};
