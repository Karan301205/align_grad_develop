import { cx } from '../../utils/cx.js';
import InfoTip from './InfoTip.jsx';

export function Panel({ className, children, ...rest }) {
  return (
    <section className={cx('min-w-0 rounded-xl border border-line bg-panel', className)} {...rest}>
      {children}
    </section>
  );
}

/** `info` adds an (i) beside the title (hover or focus explains the section); `icon` adds a small tinted icon before it. */
export function PanelHeader({ title, subtitle, info, icon: Icon, action, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-3 border-b border-line px-4 py-3.5', className)}>
      {Icon && (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[15px] font-bold leading-tight">{title}</h2>
          {info && <InfoTip label={title}>{info}</InfoTip>}
        </div>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PanelBody({ className, children }) {
  return <div className={cx('p-4', className)}>{children}</div>;
}
