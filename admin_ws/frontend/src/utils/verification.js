// Company verification statuses written by main_website (the recruiter submits) and
// this portal (the admin approves or rejects). Mirrors the backend's lifecycle.

export const VERIFICATION_STATUS = {
  PENDING: { label: 'Pending review', tone: 'warn' },
  APPROVED: { label: 'Approved', tone: 'ok' },
  REJECTED: { label: 'Rejected', tone: 'bad' },
  NOT_SUBMITTED: { label: 'Not submitted', tone: 'neutral' }
};

export function verificationMeta(status) {
  return VERIFICATION_STATUS[status] || VERIFICATION_STATUS.NOT_SUBMITTED;
}

/** Tabs on the Companies page: key → filter. */
export const COMPANY_TABS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'PENDING', label: 'Pending review', test: (c) => c.verificationStatus === 'PENDING' },
  { key: 'APPROVED', label: 'Approved', test: (c) => c.verificationStatus === 'APPROVED' },
  { key: 'REJECTED', label: 'Rejected', test: (c) => c.verificationStatus === 'REJECTED' },
  { key: 'NOT_SUBMITTED', label: 'Not submitted', test: (c) => c.verificationStatus === 'NOT_SUBMITTED' }
];

/** Which decision buttons apply to a company: you can't approve an approved company, or reject a rejected one. */
export function availableDecisions(company) {
  return {
    canApprove: Boolean(company) && company.verificationStatus !== 'APPROVED',
    canReject: Boolean(company) && company.verificationStatus !== 'REJECTED'
  };
}

export const MIN_REJECTION_REASON = 5;

/** Message for an unusable rejection reason, or '' when it is fine to send. */
export function rejectionReasonProblem(reason) {
  return String(reason || '').trim().length < MIN_REJECTION_REASON
    ? `Please enter a rejection reason (at least ${MIN_REJECTION_REASON} characters). It is included in the email to the recruiter.`
    : '';
}
