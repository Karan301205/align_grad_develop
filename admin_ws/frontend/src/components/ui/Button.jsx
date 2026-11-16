import { LoaderCircle } from 'lucide-react';
import { cx } from '../../utils/cx.js';

const VARIANT = {
  default: 'border-line-strong bg-panel text-ink hover:bg-subtle',
  primary: 'border-accent bg-accent text-white hover:border-accent-ink hover:bg-accent-ink',
  good: 'border-ok bg-ok text-white hover:brightness-95',
  danger: 'border-line-strong bg-panel text-bad hover:border-bad/40 hover:bg-bad-soft',
  ghost: 'border-transparent bg-transparent text-ink-2 hover:bg-subtle'
};

const SIZE = {
  sm: 'h-8 gap-1.5 px-2.5 text-[13px]',
  md: 'h-9 gap-2 px-3.5 text-sm'
};

export default function Button({
  variant = 'default',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-lg border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}
