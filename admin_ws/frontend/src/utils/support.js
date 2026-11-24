// Support tickets page: statuses, tabs, filtering and small display helpers. Pure functions.
// Statuses come from admin_ws/backend/src/modules/support/supportTickets.js:
//   OPEN      waiting on AlignGrad (new, or the requester wrote again)
//   PENDING   an admin replied; waiting on the requester
//   RESOLVED  closed; a new message from the requester reopens it
import { matchesQuery } from './collections.js';
import { formatDate } from './format.js';

export const REPLY_MAX = 5000; // same limit as the backend

const STATUS_META = {
  OPEN: { label: 'Needs reply', tone: 'info' },
  PENDING: { label: 'Waiting on requester', tone: 'warn' },
  RESOLVED: { label: 'Resolved', tone: 'ok' }
};

export function ticketStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.OPEN;
}

/** Tabs over the list: one per status plus All. The key is the status it shows. */
export const SUPPORT_TABS = [
  { key: 'OPEN', label: 'Needs reply' },
  { key: 'PENDING', label: 'Waiting on requester' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'all', label: 'All' }
];

export const ROLE_FILTERS = [
  { key: 'all', label: 'Everyone' },
  { key: 'STUDENT', label: 'Candidates' },
  { key: 'RECRUITER', label: 'Companies' }
];

/** { OPEN, PENDING, RESOLVED, all } from the tickets on screen (kept in step after every change). */
export function countTickets(tickets) {
  const counts = { OPEN: 0, PENDING: 0, RESOLVED: 0, all: tickets.length };
  for (const ticket of tickets) {
    if (counts[ticket.status] !== undefined) counts[ticket.status] += 1;
  }
  return counts;
}

/** Tickets in the tab, from the chosen kind of requester, matching the search (subject, reference, name, email, topic). */
export function filterTickets(tickets, { tab = 'all', role = 'all', query = '' } = {}) {
  return tickets.filter(
    (ticket) =>
      (tab === 'all' || ticket.status === tab) &&
      (role === 'all' || ticket.role === role) &&
      matchesQuery(
        [ticket.subject, ticket.reference, ticket.categoryLabel, ticket.requester?.name, ticket.requester?.email, ticket.requester?.companyName],
        query
      )
  );
}

/** "just now", "5 min ago", "3 h ago", "2 d ago", then the date. `now` is a timestamp (ms). */
export function timeAgo(value, now = Date.now()) {
  const time = new Date(value).getTime();
  if (!value || Number.isNaN(time)) return '';
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return formatDate(value);
}

/** Why a reply can't be sent yet, or '' when it can. */
export function replyProblem(text) {
  const trimmed = String(text || '').trim();
  if (trimmed.length < 2) return 'Write a reply first.';
  if (trimmed.length > REPLY_MAX) return `Keep the reply under ${REPLY_MAX} characters.`;
  return '';
}

/** The requester as one line: "Riya Sharma (Acme)", or their email when no name is on file. */
export function requesterLabel(requester = {}) {
  const name = requester.name || requester.email || 'Unknown requester';
  return requester.companyName && requester.companyName !== name ? `${name} (${requester.companyName})` : name;
}

/** The list row for a ticket the API just returned (drops the conversation, keeps the summary fields). */
export function toSummary(ticket) {
  const { messages, ...summary } = ticket;
  void messages;
  return summary;
}
