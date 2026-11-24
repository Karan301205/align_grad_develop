// Help & support tickets as the admin sees them (pure shaping, no database).
//
// Tickets are raised by candidates and recruiters in main_website (modules/support);
// this is a copy of the statuses, authors and topic labels there
// (main_website/backend/src/modules/support/supportRules.js), kept separate because
// admin_ws must not import from main_website. Keep both in sync.
//
//   OPEN      waiting on AlignGrad: a new ticket, or the requester wrote again
//   PENDING   an admin replied; waiting on the requester
//   RESOLVED  closed by an admin; a new message from the requester reopens it

const TICKET_STATUS = Object.freeze({ OPEN: 'OPEN', PENDING: 'PENDING', RESOLVED: 'RESOLVED' });
const STATUSES = Object.values(TICKET_STATUS);
const MESSAGE_AUTHOR = Object.freeze({ USER: 'USER', ADMIN: 'ADMIN' });

const CATEGORY_LABELS = Object.freeze({
  STUDENT: {
    ACCOUNT: 'Account and sign-in',
    PROFILE: 'My profile',
    JOBS: 'Jobs and applications',
    TESTS: 'Skill tests',
    GIGS: 'Gigs',
    COURSES: 'Courses',
    PAYMENTS: 'Payments',
    OTHER: 'Something else'
  },
  RECRUITER: {
    ACCOUNT: 'Account and sign-in',
    VERIFICATION: 'Company verification',
    JOBS: 'Job posts and applicants',
    CANDIDATES: 'Finding candidates',
    GIGS: 'Gigs',
    PAYMENTS: 'Payments and job credits',
    OTHER: 'Something else'
  }
});

const PREVIEW_LENGTH = 160;

const ticketReference = (number) => `SUP-${number}`;

const categoryLabel = (role, key) => CATEGORY_LABELS[role]?.[key] || 'Something else';

const roleLabel = (role) => (role === 'RECRUITER' ? 'Company' : 'Candidate');

const toIso = (value) => (value ? new Date(value).toISOString() : null);

const normalizeStatus = (status) => (STATUSES.includes(status) ? status : TICKET_STATUS.OPEN);

/** The name to show and greet: the candidate's profile name, or the recruiter's (falling back to the company). */
function requesterName(row) {
  if (row.role === 'RECRUITER') return row.recruiterName || row.companyName || '';
  return row.profileName || '';
}

function preview(body) {
  const flat = String(body || '').replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH - 1)}…` : flat;
}

/**
 * One row of the ticket list. `row` is a "SupportTicket" row joined with the requester
 * ("User".email, "Profile".name AS profileName, "Company".name AS companyName,
 * "Company".recruiterName) and the latest message (lastAuthor, lastBody, messageCount).
 */
function formatTicketSummary(row) {
  return {
    id: row.id,
    number: row.number,
    reference: ticketReference(row.number),
    role: row.role,
    roleLabel: roleLabel(row.role),
    category: row.category,
    categoryLabel: categoryLabel(row.role, row.category),
    subject: row.subject,
    status: normalizeStatus(row.status),
    createdAt: toIso(row.createdAt),
    lastMessageAt: toIso(row.lastMessageAt || row.createdAt),
    resolvedAt: toIso(row.resolvedAt),
    messageCount: Number(row.messageCount) || 0,
    lastAuthor: row.lastAuthor === MESSAGE_AUTHOR.ADMIN ? MESSAGE_AUTHOR.ADMIN : MESSAGE_AUTHOR.USER,
    preview: preview(row.lastBody),
    requester: {
      userId: row.userId,
      email: row.email || '',
      name: requesterName(row),
      companyName: row.role === 'RECRUITER' ? row.companyName || '' : ''
    }
  };
}

/** The list row plus the whole conversation, oldest message first. */
function formatTicketDetail(row, messages) {
  return {
    ...formatTicketSummary(row),
    messages: [...messages]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((message) => ({
        id: message.id,
        author: message.author === MESSAGE_AUTHOR.ADMIN ? MESSAGE_AUTHOR.ADMIN : MESSAGE_AUTHOR.USER,
        body: message.body,
        createdAt: toIso(message.createdAt)
      }))
  };
}

/** { OPEN, PENDING, RESOLVED, total } for the tabs, KPIs and the sidebar badge. */
function countByStatus(tickets) {
  const counts = { OPEN: 0, PENDING: 0, RESOLVED: 0, total: tickets.length };
  for (const ticket of tickets) counts[normalizeStatus(ticket.status)] += 1;
  return counts;
}

/** An admin reply leaves the ticket waiting on the requester, or closes it when asked to. */
const statusAfterAdminReply = (resolve) => (resolve ? TICKET_STATUS.RESOLVED : TICKET_STATUS.PENDING);

/**
 * Link that opens Help & support in main_website for this requester: the portal address
 * from env with `open=support` added (App.jsx reads it). '' when no address is configured
 * or it isn't a valid http(s) URL, so the email simply has no button.
 */
function supportLink(role, { RECRUITER_PORTAL_URL, CANDIDATE_PORTAL_URL } = {}) {
  const base = role === 'RECRUITER' ? RECRUITER_PORTAL_URL : CANDIDATE_PORTAL_URL;
  if (!base) return '';
  try {
    const url = new URL(base);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    url.searchParams.set('open', 'support');
    return url.toString();
  } catch {
    return '';
  }
}

module.exports = {
  TICKET_STATUS,
  STATUSES,
  MESSAGE_AUTHOR,
  CATEGORY_LABELS,
  ticketReference,
  categoryLabel,
  roleLabel,
  requesterName,
  formatTicketSummary,
  formatTicketDetail,
  countByStatus,
  statusAfterAdminReply,
  supportLink
};
