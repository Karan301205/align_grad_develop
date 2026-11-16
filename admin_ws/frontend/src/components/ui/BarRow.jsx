import { cx } from '../../utils/cx.js';

const FILL = { accent: 'bg-accent', ok: 'bg-ok', info: 'bg-info', warn: 'bg-warn', neutral: 'bg-neutral', gigs: 'bg-series-gigs' };

/** One labelled progress bar. `percent` is 0–100; `display` is the text on the right. */
export default function BarRow({ label, display, percent, tone = 'accent' }) {
  const width = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate font-medium text-ink-2" title={label}>
          {label}
        </span>
        <span className="shrink-0 font-semibold">{display}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
        className="h-2 overflow-hidden rounded-full bg-subtle"
      >
        <div className={cx('h-full rounded-full', FILL[tone])} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
