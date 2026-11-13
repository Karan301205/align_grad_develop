import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { userMessage } from '../../../../services/apiClient';
import { createPaymentOrder, getPaymentPlanStatus, openRazorpayCheckout } from '../../../../services/paymentService';
import { FREE_PLAN_GIG_LIMIT, FREE_PLAN_JOB_LIMIT } from '../../../../utils/jobAccess';
import { formatInr } from '../../../../utils/format';
import { BODY, GRADIENT, HEADING_FONT, INK, MUTED, PRIMARY } from '../profileTheme';
import { Dialog, ErrorBanner, Spinner } from '../ui';

function Point({ children, strong }) {
  return (
    <li className="flex gap-2.5">
      <Check aria-hidden="true" className={`mt-0.5 size-[18px] shrink-0 ${strong ? 'text-[#0167F6]' : 'text-[#0F7A55]'}`} strokeWidth={2.5} />
      <span>{children}</span>
    </li>
  );
}

/**
 * Student Pro (design: Web — Student Pro dialog). Price and plan come from
 * GET /payments/status; "Pay" runs the existing Razorpay checkout.
 */
export default function StudentProDialog({ token, user, profile, jobsCount, onUpgraded, onClose }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getPaymentPlanStatus(token)
      .then((data) => alive && setStatus(data))
      .catch((err) => alive && setError(userMessage(err, 'We couldn’t load the Student Pro price. Please try again.')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [token]);

  const offer = status?.offer;
  const isPro = status?.isPremium || profile?.plan === 'PREMIUM';
  const price = offer ? formatInr(offer.amount) : '';

  const pay = async () => {
    if (!offer) return;
    setPaying(true);
    setError('');
    try {
      const order = await createPaymentOrder(token, offer.planType);
      openRazorpayCheckout({
        token,
        order,
        planType: offer.planType,
        user: { ...user, name: profile?.name, email: profile?.email || user?.email, phone: profile?.phone },
        onSuccess: () => {
          setPaying(false);
          onUpgraded();
        },
        onFailure: (err) => {
          console.error('[payments] Student Pro payment failed:', err);
          setPaying(false);
          setError(userMessage(err, 'The payment didn’t go through. Please try again.'));
        },
        onDismiss: () => setPaying(false)
      });
    } catch (err) {
      setPaying(false);
      setError(userMessage(err, 'We couldn’t start the payment. Please try again.'));
    }
  };

  return (
    <Dialog
      title={isPro ? 'You’re on Student Pro' : 'See every job and gig on AlignGrad'}
      subtitle={isPro ? 'Every job and gig is open to you, for life.' : 'Not just the ones at the top of your list. Pay once, keep it for life.'}
      onClose={onClose}
      busy={paying}
      width="max-w-[720px]"
      badge={
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#F1ECFF] px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.04em] text-[#5B2AA6]">
          <Sparkles aria-hidden="true" className="size-3.5" /> Student Pro
        </span>
      }
    >
      <ErrorBanner message={error} />
      {loading ? (
        <div className={`flex items-center justify-center gap-2 py-10 ${MUTED}`}>
          <Spinner /> Loading plans…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <section aria-labelledby="plan-free" className={`flex flex-col gap-3.5 rounded-[14px] bg-[#F4F6FE] p-5 ${BODY}`}>
            <div className="flex flex-col gap-0.5">
              <h3 id="plan-free" className="m-0 text-[16px]">
                <span className={`font-bold ${INK}`}>Free</span>
              </h3>
              <span className={`${HEADING_FONT} text-[26px] font-bold ${INK}`}>₹0</span>
              <span className={MUTED}>For everyone, always</span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              <Point>Skill tests and your scores</Point>
              <Point>
                Your top {FREE_PLAN_JOB_LIMIT} matched jobs and top {FREE_PLAN_GIG_LIMIT} gigs
              </Point>
              <Point>Applying, pitching and interview updates</Point>
            </ul>
            <span className="mt-auto flex h-11 items-center justify-center rounded-[10px] border border-[#C9D1E3] bg-white font-semibold text-[#475373]">{isPro ? 'Included' : 'Your current plan'}</span>
          </section>
          <section aria-labelledby="plan-pro" className="relative flex flex-col gap-3.5 overflow-hidden rounded-[14px] border-2 border-[#6378F9] bg-white p-5">
            <div className={`absolute inset-x-0 top-0 h-1 ${GRADIENT}`} aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              <h3 id="plan-pro" className="m-0 text-[16px]">
                <span className={`font-bold ${INK}`}>Student Pro</span>
              </h3>
              <span className={`${HEADING_FONT} text-[26px] font-bold ${INK}`}>{price || '—'}</span>
              <span className={MUTED}>{offer?.label ? `${offer.label} · one-time payment, no monthly fees` : 'One-time payment, no monthly fees'}</span>
            </div>
            <ul className={`m-0 flex list-none flex-col gap-2.5 p-0 ${INK}`}>
              <Point strong>Everything in Free</Point>
              <Point strong>{jobsCount > 0 ? `All ${jobsCount} jobs open now, every gig, and every new one` : 'Every job and gig, and every new one'}</Point>
              <Point strong>Apply to any job you meet the bars for</Point>
            </ul>
            {isPro ? (
              <span className="mt-auto flex h-11 items-center justify-center rounded-[10px] bg-[#E3F5EE] font-semibold text-[#0B5E41]">Your current plan</span>
            ) : (
              <button type="button" onClick={pay} disabled={paying || !offer} className={`${PRIMARY} mt-auto h-11 w-full`}>
                {paying && <Spinner />}
                {paying ? 'Opening payment…' : price ? `Pay ${price}` : 'Price unavailable'}
              </button>
            )}
          </section>
        </div>
      )}
      <div className="flex flex-col gap-1 border-t border-[#EEF0F6] pt-4">
        <span className={BODY}>Pro doesn’t change your skill scores. Recruiters still decide using your scores and profile.</span>
        <span className={`text-[13px] ${MUTED}`}>Secure payment by Razorpay</span>
      </div>
    </Dialog>
  );
}
