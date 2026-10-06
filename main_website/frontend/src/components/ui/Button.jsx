import React from 'react';
import { Loader2 } from 'lucide-react';

// Physical keys — depress on click (translate + shadow inversion via .glass-*:active)
const VARIANT_CLASSES = {
  primary: 'glass-button-primary text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none shadow-sm font-bold',
  secondary: 'glass-button text-slate-900 dark:text-slate-100 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none border border-slate-400/60 dark:border-slate-600 shadow-sm font-bold',
  ghost: 'text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none font-bold',
  danger: 'glass-button text-white bg-red-600 hover:bg-red-700 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none shadow-sm font-bold',
  tertiary: 'glass-button-secondary text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white active:translate-y-px disabled:opacity-50 disabled:pointer-events-none shadow-sm font-bold',
};

const SIZE_CLASSES = {
  sm: 'px-3.5 py-1.5 text-[13px] gap-1.5 rounded-md font-semibold',
  md: 'px-5 py-2.5 text-[15px] gap-2 rounded-xl font-semibold',
  lg: 'px-7 py-3.5 text-[15px] gap-2 rounded-xl font-semibold',
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
      className={`inline-flex items-center justify-center font-semibold font-sans tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
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
