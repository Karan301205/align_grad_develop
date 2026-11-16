import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { cx } from '../../utils/cx.js';
import Button from './Button.jsx';

const TONE = {
  error: { box: 'border-bad/30 bg-bad-soft text-bad', icon: CircleAlert },
  warning: { box: 'border-warn/30 bg-warn-soft text-warn', icon: TriangleAlert },
  success: { box: 'border-ok/30 bg-ok-soft text-ok', icon: CircleCheck },
  info: { box: 'border-info/30 bg-info-soft text-info', icon: Info }
};

export default function Notice({ tone = 'info', action, className, children }) {
  const { box, icon: Icon } = TONE[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx('flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] font-medium', box, className)}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

/** The "couldn't load" banner with a retry button, for a failed resource. */
export function LoadError({ what, message, onRetry, className }) {
  return (
    <Notice
      tone="error"
      className={className}
      action={
        onRetry && (
          <Button size="sm" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    >
      Couldn’t load {what}. {message}
    </Notice>
  );
}
