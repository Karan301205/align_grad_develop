// Chart helpers with no React in them. Tested in chart.test.js.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A tidy value axis from 0 to just above `maxValue`: { max, step, ticks }. Steps are whole
 * numbers (the charts count things), so a small maximum gives 0, 1, 2, 3 rather than 0.75s.
 */
export function niceScale(maxValue, tickCount = 4) {
  const max = Math.max(0, Number(maxValue) || 0);
  if (max === 0) return { max: tickCount, step: 1, ticks: Array.from({ length: tickCount + 1 }, (_, i) => i) };
  const rough = max / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const nice = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = Math.max(1, nice * magnitude);
  const top = Math.ceil(max / step) * step;
  return { max: top, step, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
}

const parseDay = (iso) => {
  const [year, month, day] = String(iso).split('-').map(Number);
  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day) ? { year, month, day } : null;
};

/** "2026-11-09" → "9 Nov" (the week's first day). */
export function weekLabel(iso) {
  const d = parseDay(iso);
  return d ? `${d.day} ${MONTHS[d.month - 1]}` : '';
}

/** "2026-11-09" → "9–15 Nov", or "28 Oct–3 Nov" when the week crosses a month. */
export function weekRangeLabel(iso) {
  const d = parseDay(iso);
  if (!d) return '';
  const end = new Date(Date.UTC(d.year, d.month - 1, d.day + 6));
  const endDay = end.getUTCDate();
  const endMonth = MONTHS[end.getUTCMonth()];
  return end.getUTCMonth() === d.month - 1 ? `${d.day}–${endDay} ${endMonth}` : `${d.day} ${MONTHS[d.month - 1]}–${endDay} ${endMonth}`;
}

/** Whole-number percentage of `part` in `total`; 0 when there is no total. */
export const percentOf = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

/** True when any number in the list is above zero. */
export const hasAny = (values) => values.some((value) => Number(value) > 0);
