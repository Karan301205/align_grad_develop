import React, { useState } from 'react';
import { X, ShieldCheck, Check, Sparkles, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { createPaymentOrder, openRazorpayCheckout } from '../services/paymentService';

export default function PaymentModal({
  isOpen,
  onClose,
  planType = 'STUDENT_LIFETIME',
  token,
  user = {},
  onSuccess,
  onFailure
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const isStudent = planType === 'STUDENT_LIFETIME';

  const planDetails = isStudent
    ? {
        title: 'AlignGrade Student Pro',
        subtitle: 'Lifetime Career Acceleration',
        badge: 'One-Time Payment • Lifetime Access',
        price: '₹2,500',
        features: [
          'Unlock all job openings across the platform (remove blur & gating)',
          'Apply directly to unlimited verified opportunities',
          'Full skill-test certifications with verified badges',
          'Priority candidate ranking for recruiter talent discovery',
          'Lifetime access with zero recurring monthly fees'
        ]
      }
    : {
        title: 'Recruiter 5-Job Pack',
        subtitle: 'Scale Your Hiring Pipeline',
        badge: '5 Job Postings • ₹2,500 Pack',
        price: '₹2,500',
        features: [
          'Post 5 additional verified job openings',
          'Automated AI skill gating & candidate match scoring',
          'Direct access to top verified student profiles',
          'Full applicant review & hiring workflow tools',
          'Repeatable — purchase again whenever quota is exhausted'
        ]
      };

  const handleInitiatePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Request backend to create Razorpay Order
      const order = await createPaymentOrder(token, planType);

      // 2. Launch Razorpay standard checkout popup
      openRazorpayCheckout({
        token,
        order,
        planType,
        user,
        onSuccess: (res) => {
          setLoading(false);
          if (onSuccess) onSuccess(res);
          onClose();
        },
        onFailure: (err) => {
          setLoading(false);
          setError(err?.message || 'Payment processing failed');
          if (onFailure) onFailure(err);
        },
        onDismiss: () => {
          setLoading(false);
        }
      });
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Failed to start payment process');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative animate-zoom-in"
        style={{
          boxShadow: '0 20px 40px -15px rgba(0, 53, 39, 0.25)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Banner */}
        <div className="p-6 pb-4 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-outline-variant">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-headline font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{planDetails.badge}</span>
          </div>

          <h3 className="text-xl font-headline font-bold text-on-surface tracking-tight">
            {planDetails.title}
          </h3>
          <p className="text-xs font-sans text-on-surface-variant mt-0.5">
            {planDetails.subtitle}
          </p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-headline font-black text-emerald-700 dark:text-emerald-400">
              {planDetails.price}
            </span>
            <span className="text-xs font-sans text-on-surface-variant">
              {isStudent ? 'one-time lifetime payment' : 'for 5 job postings'}
            </span>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="p-6 space-y-3">
          <p className="text-xs font-headline font-semibold text-on-surface uppercase tracking-wider">
            Included in this plan:
          </p>
          <ul className="space-y-2.5">
            {planDetails.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs font-sans text-on-surface">
                <div className="mt-0.5 rounded-full p-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 flex flex-col gap-3">
          <button
            onClick={handleInitiatePayment}
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-headline font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Opening Razorpay Gateway...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay {planDetails.price} with Razorpay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] font-sans text-on-surface-variant">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit encrypted checkout via Razorpay</span>
            <span className="text-outline-variant">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">Test Mode</span>
          </div>

          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] font-sans text-amber-800 dark:text-amber-300 text-center">
            💡 <strong>Testing Tip:</strong> In the Razorpay popup, select <strong>Netbanking</strong> (e.g. HDFC/SBI) → click the green <strong>"Success"</strong> button to simulate instant test payment!
          </div>
        </div>
      </div>
    </div>
  );
}
