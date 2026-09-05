import React from 'react';

export default function Input({ label, error, className = '', containerClassName = '', ...rest }) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-[10px] font-headline font-medium uppercase tracking-[0.08em] text-on-surface-variant mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-surface-container-low neu-recessed border-none rounded-lg px-4 py-3 text-sm font-sans font-normal text-on-surface placeholder-on-surface-variant/50 outline-none transition-all focus:outline-none focus-visible:shadow-[var(--shadow-recessed),0_0_0_2px_var(--c-primary)] ${error ? 'shadow-[var(--shadow-recessed),0_0_0_2px_var(--c-error)]' : ''} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
