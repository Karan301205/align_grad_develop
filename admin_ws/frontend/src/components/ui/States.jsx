import { Inbox, LoaderCircle } from 'lucide-react';
import { cx } from '../../utils/cx.js';

export function Loading({ children = 'Loading…', className }) {
  return (
    <div role="status" className={cx('flex items-center justify-center gap-2 p-10 text-sm text-muted', className)}>
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, children, className }) {
  return (
    <div className={cx('flex flex-col items-center gap-2 p-10 text-center text-sm text-muted', className)}>
      <Icon className="size-8 text-faint" aria-hidden="true" />
      <p className="max-w-sm">{children}</p>
    </div>
  );
}
