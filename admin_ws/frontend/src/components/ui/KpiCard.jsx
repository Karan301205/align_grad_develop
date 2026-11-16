import { cx } from '../../utils/cx.js';

const ICON_TONE = {
  accent: 'bg-accent-soft text-accent-ink',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
  bad: 'bg-bad-soft text-bad'
};

export default function KpiCard({ label, value, hint, icon: Icon, tone = 'accent' }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-panel p-3.5">
      {Icon && (
        <span className={cx('grid size-10 shrink-0 place-items-center rounded-[10px]', ICON_TONE[tone])}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold leading-snug text-muted">{label}</div>
        <div className="text-[22px] font-bold leading-tight">{value}</div>
        {hint && <div className="text-xs leading-snug text-muted">{hint}</div>}
      </div>
    </div>
  );
}
