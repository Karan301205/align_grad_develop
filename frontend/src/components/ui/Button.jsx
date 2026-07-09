import React from 'react';
import { Loader2 } from 'lucide-react';

// Physical keys — depress on click (translate + shadow inversion via .glass-*:active)
const VARIANT_CLASSES = {
  primary: 'glass-button-primary text-on-primary hover:brightness-110 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none',
  secondary: 'glass-button text-on-surface hover:brightness-[1.03] hover:text-primary active:translate-y-px disabled:opacity-50 disabled:pointer-events-none',
  ghost: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low hover:shadow-[var(--shadow-recessed)] active:translate-y-px disabled:opacity-50 disabled:pointer-events-none',
  danger: 'glass-button text-error hover:text-on-error hover:bg-error active:translate-y-px disabled:opacity-50 disabled:pointer-events-none',
  tertiary: 'glass-button-secondary text-on-tertiary hover:brightness-105 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none',
};

const SIZE_CLASSES = {
  sm: 'px-4 py-2 text-[11px] gap-1.5 rounded-md',
  md: 'px-5 py-2.5 text-xs gap-2 rounded-lg',
  lg: 'px-7 py-3.5 text-sm gap-2 rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-bold font-headline uppercase tracking-[0.06em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" />
      )}
      {children}
    </button>
  );
}
