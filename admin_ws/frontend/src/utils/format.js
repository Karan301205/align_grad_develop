// Small display helpers shared by every admin page. Pure functions, no React.

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "12 Nov 2026", or "" when the value is missing or not a date. */
export function formatDate(value) {
  const date = toDate(value);
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

/** "12 Nov 2026, 02:30 pm", or "" when the value is missing or not a date. */
export function formatDateTime(value) {
  const date = toDate(value);
  return date
    ? date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';
}

/** "1 candidate" / "2 candidates". */
export function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`;
}

/**
 * Returns the URL only when it is a web address. Profile and company links are typed by
 * users, and an `href="javascript:..."` would run script in the admin's browser.
 */
export function safeUrl(value) {
  const text = String(value || '').trim();
  return /^https?:\/\//i.test(text) ? text : '';
}

/** Dollar amount for the storage cost cards, e.g. "$0.0123". */
export function usd(value, digits = 4) {
  const number = Number(value);
  return `$${(Number.isFinite(number) ? number : 0).toFixed(digits)}`;
}

/** A plain address like name@example.com: no spaces, one @, a dot in the domain. Used before making a mailto link. */
export const isEmail = (value) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(value || '').trim());
