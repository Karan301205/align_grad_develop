import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES = {
  primary: 'brand-gradient text-white shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  secondary: 'bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-container-high active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  ghost: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  danger: 'bg-error-container text-on-error-container border border-error/20 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  tertiary: 'bg-tertiary text-on-tertiary hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
};

const SIZE_CLASSES = {
  sm: 'px-4 py-2 text-xs gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3.5 text-sm gap-2 rounded-xl',
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
      className={`inline-flex items-center justify-center font-bold font-headline transition-all ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
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
