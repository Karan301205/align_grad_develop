import { formatInr } from '../../../../utils/format';
import { CARD, CARD_TITLE, MUTED, SECONDARY_BUTTON } from '../../components/accountStyles';

const MAX_SEGMENTS = 20;

/** Job credits from GET /payments/status; buying happens on Plan & billing. */
export default function CreditsCard({ credits, onBuy }) {
  const quota = credits.quota;
  const offer = credits.offer;
  const total = quota?.jobPostingQuota || 0;
  const used = Math.min(quota?.totalJobs || 0, total);
  return (
    <section aria-labelledby="credits-title" className={`${CARD} flex flex-col gap-3 px-5 py-[18px]`}>
      <h2 id="credits-title" className={CARD_TITLE}>
        <span className="font-semibold">Job credits</span>
      </h2>
      {credits.error ? (
        <span role="alert" className="text-[#B91C1C]">
          Couldn’t load job credits. {credits.error}
        </span>
      ) : !quota ? (
        <span className={MUTED}>{credits.loading ? 'Checking your job credits…' : 'The server did not return job credits.'}</span>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-bold leading-none tabular-nums">{quota.remainingJobs}</span>
            <span className={MUTED}>
              of {total} job post{total === 1 ? '' : 's'} left
            </span>
          </div>
          {total > 0 &&
            (total <= MAX_SEGMENTS ? (
              <div role="img" aria-label={`${used} of ${total} credits used`} className="grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
                {Array.from({ length: total }, (_, index) => (
                  <div key={index} className={`h-1.5 rounded-[3px] ${index < used ? 'bg-[#023836]' : 'bg-[#E4E6EA]'}`} />
                ))}
              </div>
            ) : (
              <div role="img" aria-label={`${used} of ${total} credits used`} className="h-1.5 overflow-hidden rounded-[3px] bg-[#E4E6EA]">
                <div className="h-full bg-[#023836]" style={{ width: `${(used / total) * 100}%` }} />
              </div>
            ))}
        </>
      )}
      <button type="button" onClick={onBuy} className={`${SECONDARY_BUTTON} h-10`}>
        {offer?.jobCredits ? `Buy ${offer.jobCredits} more · ${formatInr(offer.amount)}` : 'Plan & billing'}
      </button>
    </section>
  );
}
