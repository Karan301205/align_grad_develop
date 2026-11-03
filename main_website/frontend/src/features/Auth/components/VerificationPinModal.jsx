import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  X, 
  AlertTriangle, 
  Clock, 
  RotateCw, 
  ArrowRight, 
  CheckCircle2, 
  Mail,
  Edit3
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { verifySignupPin, resendSignupPin } from '../services/authVerificationApi';

const PIN_LENGTH = 6;
const EXPIRY_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 60s cooldown

export default function VerificationPinModal({
  isOpen,
  onClose,
  email,
  role = 'STUDENT',
  onSuccess
}) {
  const [pinDigits, setPinDigits] = useState(Array(PIN_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = useRef([]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPinDigits(Array(PIN_LENGTH).fill(''));
      setError('');
      setInfoMessage('');
      setLoading(false);
      setResending(false);
      setIsSuccess(false);
      setTimerSeconds(EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);

      // Auto-focus first digit
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [isOpen, email]);

  // Overall expiry timer
  useEffect(() => {
    if (!isOpen || isSuccess) return;
    if (timerSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isSuccess, timerSeconds]);

  // Resend cooldown timer
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, resendCooldown]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const nextDigits = [...pinDigits];
      nextDigits[index] = '';
      setPinDigits(nextDigits);
      return;
    }

    const nextDigits = [...pinDigits];
    nextDigits[index] = cleanVal.slice(-1); // Take latest single digit
    setPinDigits(nextDigits);
    setError('');

    // Advance focus to next input box if available
    if (index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (!pastedText) return;

    const nextDigits = [...pinDigits];
    for (let i = 0; i < pastedText.length; i++) {
      nextDigits[i] = pastedText[i];
    }
    setPinDigits(nextDigits);
    setError('');

    // Focus last filled digit or next empty digit
    const nextIndex = Math.min(pastedText.length, PIN_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const fullPin = pinDigits.join('');

  const handleVerify = async (e) => {
    if (e) e.preventDefault();

    if (fullPin.length !== PIN_LENGTH) {
      setError(`Please enter all ${PIN_LENGTH} digits of your verification code.`);
      return;
    }

    if (timerSeconds <= 0) {
      setError('Verification code has expired. Please click Resend Code below.');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const data = await verifySignupPin({
        email,
        pin: fullPin,
        role
      });

      setIsSuccess(true);

      // Allow visual confirmation before logging in
      setTimeout(() => {
        onSuccess?.(data);
      }, 700);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
      setPinDigits(Array(PIN_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await resendSignupPin({ email, role });
      setInfoMessage(res.message || 'A fresh verification code has been dispatched to your email.');
      setPinDigits(Array(PIN_LENGTH).fill(''));
      setTimerSeconds(EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend verification code. Please wait and try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
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
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="font-headline text-xl font-medium tracking-tight text-on-surface">
                Verify Your Email
              </h2>
              <p className="text-xs text-on-surface-variant mt-2 px-2 leading-relaxed">
                We sent a 6-digit verification code to:
              </p>
              <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-surface-container-high rounded-full border border-outline-variant/50 max-w-full">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-on-surface truncate">{email}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-0.5 text-on-surface-variant hover:text-primary transition-colors ml-1"
                  title="Change email"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl mb-4 text-xs flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 animate-shake">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1 leading-snug">{error}</div>
              </div>
            )}

            {/* Info Message */}
            {infoMessage && (
              <div className="p-3.5 rounded-xl mb-4 text-xs flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="flex-1 leading-snug">{infoMessage}</div>
              </div>
            )}

            {/* PIN Inputs Form */}
            <form onSubmit={handleVerify}>
              <div className="flex justify-between items-center gap-2 mb-6" onPaste={handlePaste}>
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 sm:w-12 h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-surface-container-high text-on-surface border border-outline-variant/80 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    aria-label={`Digit ${idx + 1}`}
                    autoComplete="off"
                  />
                ))}
              </div>

              {/* Timer Bar */}
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-6 px-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Code expires in:</span>
                  <span className={`font-mono font-medium ${timerSeconds <= 60 ? 'text-rose-500 animate-pulse' : 'text-on-surface'}`}>
                    {formatTimer(timerSeconds)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className={`flex items-center gap-1 font-medium transition-colors ${
                    resendCooldown > 0 || resending
                      ? 'text-on-surface-variant/40 cursor-not-allowed'
                      : 'text-primary hover:underline cursor-pointer'
                  }`}
                >
                  <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                  {resending 
                    ? 'Sending...' 
                    : resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s` 
                      : 'Resend Code'}
                </button>
              </div>

              {/* Submit CTA Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full flex items-center justify-center gap-2 py-3"
                disabled={loading || fullPin.length !== PIN_LENGTH}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Activate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Back to registration
              </button>
            </div>
          </div>
        ) : (
          /* Success Confirmation View */
          <div className="text-center py-6">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 mb-4 animate-scale-up">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-headline text-xl font-medium text-on-surface mb-2">
              Email Verified Successfully!
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your account is now activated. Redirecting you to your dashboard...
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

