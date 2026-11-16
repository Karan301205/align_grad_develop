import { cx } from '../../utils/cx.js';

const TONE = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  info: 'bg-info-soft text-info',
  neutral: 'bg-neutral-soft text-neutral',
  accent: 'bg-accent-soft text-accent-ink'
};

export default function Pill({ tone = 'neutral', className, children }) {
  return (
    <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', TONE[tone], className)}>
      {children}
    </span>
  );
}
