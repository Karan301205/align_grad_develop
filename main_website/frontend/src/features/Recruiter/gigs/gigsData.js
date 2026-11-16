// Pure helpers for the recruiter Gigs pages. Gigs come from GET /gigs/my-gigs (with
// applicants) and GET /gigs/:id (with named applicants, hired freelancers,
// submissions and reviews); statuses are the server's: OPEN, IN_PROGRESS, PAUSED,
// CLOSED, COMPLETED.
import { deliveryDays, fileNameOf, money, safeLink } from '../../Gigs/gigConstants';
import { formatShortDate } from '../../../utils/format';

export const STATUS = {
  OPEN: { label: 'Open', pill: 'bg-[#E4F4EC] text-[#17794F]' },
  IN_PROGRESS: { label: 'In progress', pill: 'bg-[#E3F1EE] text-[#0F7A55]' },
  PAUSED: { label: 'Paused', pill: 'bg-[#FBF1DC] text-[#9A6312]' },
  CLOSED: { label: 'Closed', pill: 'bg-[#ECEFF0] text-[#4F5D59]' },
  COMPLETED: { label: 'Completed', pill: 'bg-[#EFEAFC] text-[#5B3FB0]' }
};
export const statusOf = (gig) => STATUS[gig?.status] || { label: gig?.status || 'Unknown', pill: 'bg-[#ECEFF0] text-[#4F5D59]' };
export const STATUS_FILTERS = [['ALL', 'All'], ...Object.entries(STATUS).map(([value, meta]) => [value, meta.label])];

/** What the owner can do in each status (PATCH /gigs/:id/status; delete and edit are limited by the server). */
export function statusActions(gig) {
  switch (gig.status) {
    case 'OPEN':
      return [['PAUSED', 'Pause gig'], ['CLOSED', 'Close gig']];
    case 'PAUSED':
      return [['OPEN', 'Resume gig'], ['CLOSED', 'Close gig']];
    case 'IN_PROGRESS':
      return [['CLOSED', 'Close gig']];
    case 'CLOSED':
      return [['OPEN', 'Reopen gig']];
    default:
      return [];
  }
}
export const canEdit = (gig) => gig.status === 'OPEN' || gig.status === 'PAUSED';
export const canDelete = canEdit;

/** Everyone hired (older rows keep the first hire in selectedCandidateId). */
export const hiredIds = (gig) => Array.from(new Set([...(gig?.hiredCandidateIds || []), gig?.selectedCandidateId].filter(Boolean)));
/** Pitches not hired yet. */
export const pendingApplicants = (gig) => {
  const hired = new Set(hiredIds(gig));
  return (gig?.applicants || []).filter((app) => !hired.has(app.candidateId));
};

// Shared with the candidate Gigs pages.
export { deliveryDays, fileNameOf, money, safeLink };
export const deliveryLabel = (value) => (value ? String(value) : '—');
export const createdLabel = (gig) => formatShortDate(gig.createdAt) || '—';
export const categoryLine = (gig) => (gig.categories?.length ? gig.categories : [gig.category]).filter(Boolean).join(' · ') || 'No category';

export function gigMatches(gig, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return [gig.title, gig.category, ...(gig.categories || []), ...(gig.skills || [])].some((field) => String(field || '').toLowerCase().includes(q));
}

export const newestFirst = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

/** Name shown for a candidate id, from the gig details (hired list or applicants). */
export function personFor(gig, candidateId) {
  const hired = (gig?.hiredCandidates || []).find((h) => h.candidateId === candidateId)?.candidate;
  const applicant = (gig?.applicants || []).find((a) => a.candidateId === candidateId)?.candidate;
  return hired || applicant || { id: candidateId, name: 'Freelancer' };
}

export const initials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';
