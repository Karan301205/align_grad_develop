import React, { useState, useEffect } from 'react';
import { Mail, X, CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { sendForgotPasswordRequest } from '../services/passwordResetApi';

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '', role = 'STUDENT', theme = 'light' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setError('');
      setIsRateLimited(false);
      setIsSuccess(false);
      setLoading(false);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');
    setIsRateLimited(false);

    try {
      await sendForgotPasswordRequest(email.trim(), role);
      setIsSuccess(true);
    } catch (err) {
      if (err.status === 429) {
        setIsRateLimited(true);
      }
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md glass-card rounded-2xl p-6 sm:p-8 shadow-2xl border border-outline-variant/60 relative overflow-hidden bg-surface text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Decorative corner screws */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-outline-variant/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>

        {!isSuccess ? (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="font-headline text-xl font-medium tracking-tight text-on-surface">
                Reset Your Password
              </h2>
              <p className="text-xs text-on-surface-variant mt-1.5 px-4 leading-relaxed">
                Confirm your account email below. We'll send you a secure link to create a new password.
              </p>
            </div>

            {error && (
              <div className={`p-3.5 rounded-xl mb-4 text-xs flex items-start gap-2.5 ${
                isRateLimited 
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400' 
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                {isRateLimited ? (
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 leading-snug">
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                autoFocus
              />

              <div className="text-[11px] text-on-surface-variant/80 flex items-center gap-1.5 px-1">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Limit: 3 requests per 15 minutes</span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={isRateLimited}
                  className="flex-1 shadow-sm shadow-primary/20"
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-headline text-xl font-medium tracking-tight text-on-surface mb-2">
              Check Your Inbox
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4 px-2">
              If an account is associated with <strong className="text-on-surface font-semibold">{email}</strong>, we have dispatched a password reset link.
            </p>
            <div className="bg-surface-container-low neu-recessed rounded-xl p-3.5 text-[11px] text-on-surface-variant/90 mb-6 text-left space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                <span>The link is valid for <strong>10 minutes</strong>.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                <span>Check your spam or junk folder if you don't see it.</span>
              </div>
            </div>

            <Button
              type="button"
              fullWidth
              onClick={onClose}
              className="shadow-sm shadow-primary/20"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
