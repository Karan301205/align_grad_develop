import { cx } from '../../utils/cx.js';

export const inputClass =
  'w-full rounded-lg border border-line-strong bg-panel px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:bg-subtle disabled:text-muted';

/** A labelled control. The control goes inside, so the label is tied to it without ids. */
export default function Field({ label, hint, required, className, children }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">
        {label}
        {required && (
          <span aria-hidden="true" className="text-bad">
            {' '}
            *
          </span>
        )}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
