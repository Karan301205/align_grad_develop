import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export function cleanHumanErrorMessage(rawMsg) {
  if (!rawMsg) return '';
  let str = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);

  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const item = parsed[0];
        if (item && item.message) return item.message;
        if (item && item.field && item.message) return `**${item.field}**: ${item.message}`;
      } else if (parsed && typeof parsed === 'object') {
        if (parsed.error && typeof parsed.error === 'string' && !parsed.error.startsWith('[') && !parsed.error.startsWith('{')) {
          return parsed.error;
        }
        if (parsed.message) return parsed.message;
      }
    } catch (_) {}
  }

  return str;
}

/**
 * Parses markdown bold (**text**) or returns text with missing fields highlighted in bold
 */
export function renderFormattedMessage(msg) {
  if (!msg) return null;
  if (React.isValidElement(msg)) return msg;
  const str = typeof msg === 'string' ? msg : cleanHumanErrorMessage(msg);
  if (typeof str !== 'string') return str;

  // Split by markdown bold pattern (**...**)
  const parts = str.split(/(\*\*.*?\*\*)/g);
  if (parts.length === 1) return str;

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-slate-950 dark:text-white">
          {boldText}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Top-Right Sliding Toast Notification Card
 */
export const ToastNotification = ({ msg, type = 'error', onClose, duration = 4000 }) => {
  const [isExiting, setIsExiting] = useState(false);


  useEffect(() => {
    if (!duration || duration <= 0) return;
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  if (!msg) return null;

  const displayMsg = cleanHumanErrorMessage(msg);
  const isSuccess = type === 'success' || type === 'info';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  return (
    <div
      className={`fixed top-6 right-6 z-[100] pointer-events-auto flex items-center gap-3.5 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all min-w-[320px] max-w-md ${
        isExiting ? 'animate-toast-fade-out' : 'animate-toast-slide-in'
      } ${
        isSuccess
          ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-950 dark:text-emerald-50'
          : isError
          ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-500/40 text-rose-950 dark:text-rose-50'
          : isWarning
          ? 'bg-amber-50 dark:bg-amber-950/90 border-amber-500/40 text-amber-950 dark:text-amber-50'
          : 'bg-surface-container-high border-outline-variant text-on-surface'
      }`}
    >
      {/* Icon Badge */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white shadow-sm ${
          isSuccess ? 'bg-emerald-500' : isError ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-primary'
        }`}
      >
        {isSuccess ? <Check className="w-5 h-5 stroke-[3]" /> : <AlertCircle className="w-5 h-5 stroke-[2.5]" />}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 text-left space-y-1">
        <h4 className="font-headline font-medium text-sm text-slate-900 dark:text-white leading-tight">
          {type === 'info' ? 'Notification' : isSuccess ? 'Success' : isWarning ? 'Notice' : 'Alert'}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-200 mt-0.5 leading-relaxed font-sans break-words">
          {renderFormattedMessage(displayMsg)}
        </p>

        {/* Actionable Switch Portal CTA */}
        {typeof displayMsg === 'string' && displayMsg.includes('Recruiter portal') && (
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/recruiter/login');
              window.dispatchEvent(new PopStateEvent('popstate'));
              if (onClose) onClose();
            }}
            className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 bg-primary text-on-primary rounded-lg text-[11px] font-bold shadow hover:opacity-90 transition-all cursor-pointer"
          >
            Go to Recruiter Portal &rarr;
          </button>
        )}
        {typeof displayMsg === 'string' && displayMsg.includes('Candidate portal') && (
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, '', '/candidate/login');
              window.dispatchEvent(new PopStateEvent('popstate'));
              if (onClose) onClose();
            }}
            className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 bg-primary text-on-primary rounded-lg text-[11px] font-bold shadow hover:opacity-90 transition-all cursor-pointer"
          >
            Go to Candidate Portal &rarr;
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      {onClose && (
        <button
          type="button"
          onClick={handleClose}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export const formatAlertMessage = (msg, type = 'error', onClose) => {
  return <ToastNotification key={String(msg)} msg={msg} type={type} onClose={onClose} />;
};

export const formatErrorMessage = (msg, onClose) => {
  return <ToastNotification key={String(msg)} msg={msg} type="error" onClose={onClose} />;
};
