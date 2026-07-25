import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

/**
 * Top-Right Sliding Toast Notification Card (Screenshot 2 design)
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

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div
      className={`fixed top-6 right-6 z-50 pointer-events-auto flex items-center gap-3.5 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all min-w-[320px] max-w-md ${
        isExiting ? 'animate-toast-fade-out' : 'animate-toast-slide-in'
      } ${
        isSuccess
          ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-950 dark:text-emerald-50'
          : isError
          ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-500/40 text-rose-950 dark:text-rose-50'
          : 'bg-surface-container-high border-outline-variant text-on-surface'
      }`}
    >
      {/* Icon Badge */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white shadow-sm ${
          isSuccess ? 'bg-emerald-500' : isError ? 'bg-rose-500' : 'bg-primary'
        }`}
      >
        {isSuccess ? <Check className="w-5 h-5 stroke-[3]" /> : <AlertCircle className="w-5 h-5 stroke-[2.5]" />}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-headline font-bold text-sm text-slate-900 dark:text-white leading-tight">
          {isSuccess ? 'Congratulations!' : 'Alert'}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-200 mt-0.5 leading-relaxed font-sans truncate">
          {String(msg)}
        </p>
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
