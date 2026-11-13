// Display formatters shared by recruiter account pages.

/** "₹2,500" for an amount in paise. */
export function formatInr(paise) {
  if (!Number.isFinite(paise)) return '';
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "7 Nov" in the current year, "7 Nov 2025" otherwise; '' for a missing date. */
export function formatShortDate(value) {
  const date = toDate(value);
  if (!date) return '';
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

/** "31 Oct 2026"; '' for a missing date. */
export function formatLongDate(value) {
  const date = toDate(value);
  return date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}
