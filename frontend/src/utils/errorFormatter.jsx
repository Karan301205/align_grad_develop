import React from 'react';
import { X } from 'lucide-react';

/**
 * Parses and formats alert messages (both success and error) into a premium scalloped card.
 */
export const formatAlertMessage = (msg, type = 'error', onClose) => {
  if (!msg) return null;

  let errors = [];
  const isError = type === 'error';
  const accentColor = isError ? '#dc2626' : '#10b981';
  const titleText = isError ? 'Error !' : 'Success !';

  const trimmed = String(msg).trim();

  if (isError && trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      errors = JSON.parse(trimmed);
    } catch (e) {
      errors = [{ message: msg }];
    }
  } else {
    errors = [{ message: msg }];
  }

  return (
    <div className="relative overflow-hidden bg-surface-container-high dark:bg-[#313a3c] border border-outline-variant rounded-2xl shadow-[var(--shadow-card)] p-5 pl-7 pr-12 text-left w-full animate-fade-in">
      {/* Decorative Scalloped Wave on Left */}
      <div className="absolute top-0 left-0 bottom-0 w-4 overflow-hidden select-none pointer-events-none">
        <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 16 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M 0 0 
               L 10 0 
               Q 16 5, 10 10 
               Q 16 15, 10 20 
               Q 16 25, 10 30 
               Q 16 35, 10 40 
               Q 16 45, 10 50 
               Q 16 55, 10 60 
               Q 16 65, 10 70 
               Q 16 75, 10 80 
               Q 16 85, 10 90 
               Q 16 95, 10 100 
               L 0 100 Z" 
            fill={accentColor} 
          />
        </svg>
      </div>

      <div className="space-y-1.5">
        {!isError && (
          <div 
            className="font-headline font-extrabold text-sm tracking-wide"
            style={{ color: accentColor }}
          >
            {titleText}
          </div>
        )}
        <ul className="space-y-1.5 text-xs leading-relaxed text-on-surface-variant font-medium">
          {errors.map((err, idx) => {
            const pathStr = err.path && err.path.length > 0
              ? err.path.map(p => {
                  if (typeof p === 'number') return `#${p + 1}`;
                  return p
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, s => s.toUpperCase())
                    .trim();
                }).join(' ➔ ')
              : '';

            return (
              <li key={idx} className="flex flex-wrap items-baseline gap-1.5">
                {pathStr && (
                  <span className="shrink-0 font-mono font-bold text-[9px] bg-surface-container border border-outline-variant text-[#dc2626] px-1.5 py-0.5 rounded uppercase tracking-wide">
                    {pathStr}
                  </span>
                )}
                <span className="text-on-surface dark:text-white/90">{err.message}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant/70 hover:text-primary transition-colors p-1 rounded-lg hover:bg-surface-container-low"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export const formatErrorMessage = (msg, onClose) => {
  return formatAlertMessage(msg, 'error', onClose);
};
