import { useState } from 'react';
import PaymentModal from '../../../components/PaymentModal';
import { formatInr, formatLongDate, formatShortDate } from '../../../utils/format';
import { ACCOUNT_PAGE, CARD, MUTED, PAGE_TITLE, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../components/accountStyles';
import useBilling from './useBilling';

const CARD_HEADING = 'm-0 text-[15px] leading-[1.45] tracking-normal text-[#4B5563]';
const MAX_LISTED_JOBS = 5;
const MAX_SEGMENTS = 20; // above this the meter is one continuous bar

const isQuotaJob = (job) => job?.opportunityType !== 'GIG'; // same rule the server counts with

function CreditMeter({ used, total }) {
  const filled = Math.min(used, total);
  const label = `${filled} of ${total} credits used`;
  if (total > 0 && total <= MAX_SEGMENTS) {
    return (
      <div role="img" aria-label={label} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {Array.from({ length: total }, (_, index) => (
          <div key={index} className={`h-2 rounded-[4px] ${index < filled ? 'bg-[#023836]' : 'bg-[#E4E6EA]'}`} />
        ))}
      </div>
    );
  }
  return (
    <div role="img" aria-label={label} className="h-2 overflow-hidden rounded-[4px] bg-[#E4E6EA]">
      <div className="h-full rounded-[4px] bg-[#023836]" style={{ width: `${total > 0 ? (filled / total) * 100 : 0}%` }} />
    </div>
  );
}

function CreditsCard({ quota, jobs }) {
  const listed = jobs.slice(0, MAX_LISTED_JOBS);
  const hidden = jobs.length - listed.length;
  return (
    <section aria-labelledby="credits-title" className={`${CARD} flex min-w-0 flex-col gap-3.5 p-6`}>
      <h2 id="credits-title" className={CARD_HEADING}>
        <span className="font-semibold">Job credits</span>
      </h2>
      <div className="flex items-baseline gap-2.5">
        <span className="text-[40px] font-bold leading-none">{quota.remainingJobs}</span>
        <span className={MUTED}>of {quota.jobPostingQuota} left</span>
      </div>
      <CreditMeter used={quota.totalJobs} total={quota.jobPostingQuota} />
      <ul aria-label="Jobs using a credit" className="m-0 flex list-none flex-col gap-2 border-t border-[#EEF0F3] p-0 pt-3">
        {listed.length === 0 && <li className={MUTED}>No jobs posted yet.</li>}
        {listed.map((job) => (
          <li key={job.id} className="flex justify-between gap-2">
            <span className="min-w-0 truncate">{job.title}</span>
            <span className={`shrink-0 ${MUTED}`}>{formatShortDate(job.createdAt)}</span>
          </li>
        ))}
        {hidden > 0 && <li className={`text-[13px] ${MUTED}`}>and {hidden} more</li>}
      </ul>
    </section>
  );
}

function BuyCard({ offer, onBuy }) {
  if (!offer?.amount || !offer?.jobCredits) {
    return (
      <section aria-labelledby="buy-title" role="alert" className={`${CARD} flex min-w-0 flex-col gap-2 p-6`}>
        <h2 id="buy-title" className={CARD_HEADING}>
          <span className="font-semibold">Buy more</span>
        </h2>
        <span className="text-[#B91C1C]">Job credit packs are not available for this account right now.</span>
      </section>
    );
  }
  return (
    <section aria-labelledby="buy-title" className="flex min-w-0 flex-col gap-3.5 rounded-[12px] border-2 border-[#0F7A55] bg-white p-[23px]">
      <h2 id="buy-title" className={CARD_HEADING}>
        <span className="font-semibold">Buy more</span>
      </h2>
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span className="text-[32px] font-bold leading-none">{formatInr(offer.amount)}</span>
        <span className={MUTED}>for {offer.jobCredits} job posts</span>
      </div>
      <span className={MUTED}>{formatInr(offer.amount / offer.jobCredits)} per job post</span>
      <button type="button" onClick={onBuy} className={`${PRIMARY_BUTTON} h-11 px-4`}>
        Buy {offer.jobCredits} job credits
      </button>
    </section>
  );
}

const TH = 'border-y border-[#EEF0F3] py-2.5 font-semibold';

function PaymentsCard({ payments }) {
  return (
    <section aria-labelledby="payments-title" className={`${CARD} min-w-0`}>
      <div className="px-[22px] py-[18px]">
        <h2 id="payments-title" className="m-0 text-base leading-[1.45] tracking-normal text-[#023836]">
          <span className="font-semibold">Payment history</span>
        </h2>
      </div>
      {payments.length === 0 ? (
        <p className={`m-0 border-t border-[#EEF0F3] px-[22px] py-4 ${MUTED}`}>No payments yet. Credit packs you buy will show here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr className={`text-left text-xs uppercase tracking-[0.04em] ${MUTED}`}>
                <th scope="col" className={`${TH} px-[22px]`}>Date</th>
                <th scope="col" className={`${TH} px-3`}>Item</th>
                <th scope="col" className={`${TH} px-3 text-right`}>Amount</th>
                <th scope="col" className={`${TH} pl-3 pr-[22px]`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => {
                const cell = `py-3.5 ${index < payments.length - 1 ? 'border-b border-[#EEF0F3]' : ''}`;
                return (
                  <tr key={payment.id}>
                    <td className={`${cell} px-[22px]`}>{formatLongDate(payment.paidAt)}</td>
                    <td className={`${cell} px-3`}>{payment.label}</td>
                    <td className={`${cell} px-3 text-right tabular-nums`}>{formatInr(payment.amount)}</td>
                    <td className={`${cell} pl-3 pr-[22px]`}>
                      <span className="rounded-full bg-[#DCFCE7] px-[9px] py-0.5 text-xs font-semibold text-[#166534]">Paid</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * Plan & billing (design: design/Plan & billing — job credits-html). Credits, the
 * pack price and payments all come from the server; jobs come from the layout's
 * GET /recruiter/jobs. Purchases go through the existing Razorpay PaymentModal.
 */
export default function BillingPage({ token, user, jobs, setAlertConfig, onRefresh }) {
  const { loading, error, status, payments, reload } = useBilling(token);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const notify = (message, type = 'info') => setAlertConfig({ message, type });

  const quotaJobs = (Array.isArray(jobs) ? jobs : [])
    .filter(isQuotaJob)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const offer = status?.offer;

  return (
    <div className={ACCOUNT_PAGE}>
      <div className="mx-auto flex max-w-[1100px] flex-col gap-[22px]">
        <header className="flex flex-col gap-1">
          <h1 className={PAGE_TITLE}>
            <span className="font-bold">Plan &amp; billing</span>
          </h1>
          <p className={`m-0 text-[15px] ${MUTED}`}>Each job you publish uses one job credit.</p>
        </header>

        {error ? (
          <div role="alert" className={`${CARD} flex flex-col items-start gap-3 px-6 py-[22px]`}>
            <span className="font-semibold text-[#B91C1C]">We couldn’t load your billing details.</span>
            <span className={MUTED}>{error}</span>
            <button type="button" onClick={reload} disabled={loading} className={`${SECONDARY_BUTTON} h-10 px-3.5`}>
              {loading ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        ) : loading && !status ? (
          <div role="status" className={`${CARD} flex items-center gap-3 px-6 py-[22px] ${MUTED}`}>
            <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-[#0F7A55] border-t-transparent" />
            Loading your billing details…
          </div>
        ) : !status?.quotaInfo ? (
          <div role="alert" className={`${CARD} px-6 py-[22px] text-[#B91C1C]`}>
            The server did not return job credits for this account.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-5">
              <CreditsCard quota={status.quotaInfo} jobs={quotaJobs} />
              <BuyCard offer={offer} onBuy={() => setPaymentOpen(true)} />
            </div>
            <PaymentsCard payments={payments} />
          </>
        )}
      </div>

      {offer?.jobCredits > 0 && (
        <PaymentModal
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          planType={offer.planType}
          offer={offer}
          token={token}
          user={user}
          onSuccess={(result) => {
            notify(result?.alreadyProcessed ? 'This payment was already added to your account.' : `${offer.jobCredits} job credits added.`, 'success');
            reload();
            onRefresh({ silent: true });
          }}
          onFailure={(err) => notify(err?.message || 'Payment failed', 'error')}
        />
      )}
    </div>
  );
}
