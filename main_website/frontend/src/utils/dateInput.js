// Helpers for native <input type="date"> fields.
//
// Never rewrite a date input's value while the user types into it. Chrome emits
// the partial year on every keystroke (typing "2" in the year gives
// "0002-05-12"); writing a different value back (e.g. clamping it to 1950)
// resets the browser's year-typing buffer and garbles the date. Keep the raw
// value in state and check it with isDateInRange when the form is saved.

export const DATE_MIN = '1950-01-01';
export const DATE_MAX = '2099-12-31';
export const DOB_MIN = '1920-01-01';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Today as yyyy-mm-dd in the user's local time zone. */
export function todayInputValue() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * A stored date as the value an <input type="date"> takes. Only drops a time
 * suffix ("2024-05-12T00:00:00.000Z"); anything else round-trips unchanged so
 * the input keeps its typing state.
 */
export function toDateInputValue(value) {
  if (!value) return '';
  return String(value).split('T')[0];
}

/** True when `value` is a real yyyy-mm-dd calendar date within [min, max]. */
export function isDateInRange(value, min = DATE_MIN, max = DATE_MAX) {
  const match = ISO_DATE.exec(value || '');
  if (!match) return false;
  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return false;
  }
  return value >= min && value <= max;
}

/**
 * A sibling field's date to use as a min/max attribute, or `fallback` until
 * that date is complete and in range (so a half-typed year can't become a bound).
 */
export function dateBound(value, fallback) {
  const normalized = toDateInputValue(value);
  return isDateInRange(normalized) ? normalized : fallback;
}
