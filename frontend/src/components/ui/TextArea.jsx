import React from 'react';

export default function TextArea({ label, error, className = '', containerClassName = '', rows = 4, ...rest }) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none ${error ? 'border-error' : 'border-outline-variant focus:border-primary'} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
