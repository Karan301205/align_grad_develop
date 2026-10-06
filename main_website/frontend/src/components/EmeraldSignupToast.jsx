import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Sparkles, ArrowRight, UserPlus } from 'lucide-react';

/**
 * EmeraldSignupToast:
 * Slide-in notification with the signature AlignGrade emerald theme (#003527 / emerald-400)
 * alerting candidates redirected from shared job links that they need to sign up first.
 */
export default function EmeraldSignupToast({
  onClose,
  onSignUpClick,
  autoDismissMs = 8000
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = setTimeout(() => {
      handleClose();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <div
      role="alert"
      className={`fixed top-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] sm:w-[420px] bg-[#003527] text-white border-2 border-emerald-400 shadow-2xl rounded-none p-4 select-none ${
        isExiting ? 'animate-toast-fade-out' : 'animate-toast-slide-in'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Luminous Emerald Badge Icon */}
        <div className="w-10 h-10 rounded-none bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-5 h-5 text-emerald-300" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5 text-left">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-headline font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Sign Up Required</span>
            </h4>
            <button
              type="button"
              onClick={handleClose}
              className="text-emerald-300 hover:text-white p-0.5 transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs font-sans font-medium text-emerald-100 leading-relaxed">
            You need to sign up first to apply for opportunities and take verified skill certification tests.
          </p>

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleClose();
                onSignUpClick?.();
              }}
              className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-headline font-bold text-xs rounded-none transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-2.5 py-1.5 text-[11px] font-sans text-emerald-200 hover:text-white transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
