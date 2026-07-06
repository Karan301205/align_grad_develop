import React from 'react';

const VARIANT_CLASSES = {
  success: 'bg-success-container text-on-success-container border-success/20',
  warning: 'bg-tertiary-container text-on-tertiary-container border-tertiary/20',
  error: 'bg-error-container text-on-error-container border-error/20',
  primary: 'bg-primary-container text-on-primary-container border-primary/20',
  secondary: 'bg-secondary-container text-on-secondary-container border-secondary/20',
  neutral: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
};

export default function Badge({ variant = 'neutral', icon: Icon, className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold uppercase tracking-wide ${VARIANT_CLASSES[variant]} ${className}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
