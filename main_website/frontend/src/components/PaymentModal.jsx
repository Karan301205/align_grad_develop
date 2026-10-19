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
        subtitle: 'Lifetime Career Acceleration & Verified Opportunities',
        badge: 'One-Time Payment • Lifetime Access',
        price: '₹2,500',
        billingLabel: 'One-time lifetime payment • Zero recurring fees',
        features: [
          'Unlock job openings across the platform, including gated listings.',
          'Apply to eligible job opportunities.',
          'Access skill assessments and earn verified skill badges.',
          'Showcase verified skills to recruiters searching for matching talent.',
          'Discover relevant jobs, internships, and freelance gigs.',
          'Keep premium access for life, with no recurring subscription fee.'
        ]
      }
    : {
        title: 'Recruiter 5-Job Pack',
        subtitle: 'Scale Your Hiring Pipeline with Verified Talent',
        badge: '5 Job Postings • ₹2,500 Pack',
        price: '₹2,500',
        billingLabel: '5 Job Posting Credits • Repeatable Quota',
        features: [
          'Publish up to 5 job openings using your purchased posting credits.',
          'Define required skills and minimum proficiency levels for each role.',
          'Discover candidates whose verified skills align with your requirements.',
          'Review candidate profiles, skill ratings, and assessment results.',
          'Manage applicants and track recruitment progress.',
          'Use skill-based matching to make more informed hiring decisions.'
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xs dark:bg-black/60 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-surface-container border border-outline-variant rounded-2xl md:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-zoom-in"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 53, 39, 0.25)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          aria-label="Close payment modal"
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Plan Benefits & Unlocked Points */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent">
          <div>
            {/* Plan Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-headline font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 mb-3.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{planDetails.badge}</span>
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-2xl md:text-3xl font-headline font-bold text-on-surface tracking-tight">
              {planDetails.title}
            </h3>
            <p className="text-sm font-sans text-on-surface-variant mt-1.5 leading-relaxed">
              {planDetails.subtitle}
            </p>

            {/* Section Divider & Header */}
            <div className="mt-6 mb-4 flex items-center gap-2">
              <span className="text-xs font-headline font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                What gets unlocked with this plan:
              </span>
              <div className="h-px flex-1 bg-outline-variant" />
            </div>

            {/* Points List */}
            <ul className="space-y-3">
              {planDetails.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-sans text-on-surface leading-snug">
                  <div className="mt-0.5 rounded-full p-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex-shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instant Activation Guarantee */}
          <div className="mt-6 pt-4 border-t border-outline-variant/60 flex items-center gap-2 text-xs font-sans text-on-surface-variant">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Instant activation upon successful payment verification.</span>
          </div>
        </div>

        {/* Right Column: Pricing & Checkout Action */}
        <div className="w-full md:w-80 lg:w-96 p-6 md:p-8 bg-surface-container-low/70 dark:bg-surface-container-high/30 border-t md:border-t-0 md:border-l border-outline-variant flex flex-col justify-between">
          <div>
            <p className="text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
              Payment Summary
            </p>

            {/* Price Card */}
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/80 shadow-xs mb-4">
              <div className="text-xs font-sans text-on-surface-variant mb-1">
                Total Amount Due
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-headline font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                  {planDetails.price}
                </span>
                <span className="text-xs font-sans font-medium text-on-surface-variant">
                  INR
                </span>
              </div>
              <div className="mt-1 text-xs font-sans text-on-surface-variant">
                {planDetails.billingLabel}
              </div>
            </div>

            {/* Plan Specs Breakdown */}
            <div className="space-y-2 py-3 border-y border-outline-variant/70 text-xs font-sans mb-4">
              <div className="flex items-center justify-between text-on-surface">
                <span className="text-on-surface-variant">Selected Plan</span>
                <span className="font-headline font-semibold">{planDetails.title}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface">
                <span className="text-on-surface-variant">Billing Type</span>
                <span className="font-sans font-medium">{isStudent ? 'One-time Lifetime' : 'Pay-per-pack (5 jobs)'}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface">
                <span className="text-on-surface-variant">Taxes & Platform Fees</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Included</span>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {/* Pay Button */}
            <button
              onClick={handleInitiatePayment}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-headline font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
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
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Security Badges */}
            <div className="flex items-center justify-center gap-2 text-[11px] font-sans text-on-surface-variant">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-bit encrypted checkout via Razorpay</span>
              <span className="text-outline-variant">•</span>
              
            </div>

            {/* Testing Tip Box */}
            
          </div>
        </div>
      </div>
    </div>
  );
}
