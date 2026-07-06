import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({ label, error, className = '', containerClassName = '', children, ...rest }) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full appearance-none bg-surface-container-low border rounded-xl px-4 py-3 pr-10 text-sm text-on-surface transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${error ? 'border-error' : 'border-outline-variant focus:border-primary'} ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="w-4 h-4 text-on-surface-variant absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
