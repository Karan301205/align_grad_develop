import AccountIcon from '../../components/AccountIcon';
import { MUTED } from '../../components/accountStyles';
import { barsLine, joiningLine, openingsLine, payLine, typeLine } from '../summary';
import { Chip, SideCard, TextButton } from './ui';

const nf = (n) => Number(n || 0).toLocaleString('en-IN');

/** Skills that have no test yet, so their bar cannot stop anyone applying. */
const ungatedSkills = (pool) => (pool.data?.requirements || []).filter((req) => !req.gates).map((req) => req.skillName);

/**
 * "Candidates who meet all your bars": the live count from the server, with the
 * one-point relaxation that would add the most candidates (skills step) or a note.
 */
export function PoolCard({ pool, showTip, note }) {
  const counting = pool.status === 'loading' && !pool.data;
  const ungated = ungatedSkills(pool);
  return (
    <SideCard id="pool-title" title="Candidates who meet all your bars" live>
      {pool.status === 'idle' && (
        <>
          <span aria-hidden="true" className="text-[32px] font-bold leading-none text-[#9CA3AF]">—</span>
          <span className="text-[#334155]">Add skills in the Skills &amp; bars step to see how many candidates qualify.</span>
        </>
      )}
      {counting && <span className={MUTED}>Counting candidates…</span>}
      {pool.status === 'error' && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <span className="text-[#B91C1C]">{pool.error}</span>
          <TextButton onClick={pool.retry} className="px-0">Try again</TextButton>
        </div>
      )}
      {pool.data && pool.status !== 'error' && (
        <>
          <div className={`flex flex-wrap items-baseline gap-2.5 ${pool.status === 'loading' ? 'opacity-50' : ''}`}>
            <span className="text-[40px] font-bold leading-none tabular-nums">{nf(pool.data.eligible)}</span>
            <span className={MUTED}>of {nf(pool.data.total)} on AlignGrad today</span>
          </div>
          {showTip && pool.data.bestRelaxation && (
            <div className="flex gap-2.5 rounded-[10px] bg-[#F5F7FB] p-3 text-[#334155]">
              <AccountIcon name="info" size={18} className="mt-px text-[#0F7A55]" />
              <span>
                Lowering {pool.data.bestRelaxation.skillName} to {pool.data.bestRelaxation.to} adds {nf(pool.data.bestRelaxation.adds)} candidate{pool.data.bestRelaxation.adds === 1 ? '' : 's'}.
              </span>
            </div>
          )}
          {showTip && ungated.length > 0 && (
            <span className={`text-[13px] ${MUTED}`}>
              {ungated.join(', ')} {ungated.length === 1 ? 'has' : 'have'} no skill test yet, so {ungated.length === 1 ? 'that bar doesn’t' : 'those bars don’t'} limit who can apply.
            </span>
          )}
        </>
      )}
      {note && <span className="text-[#334155]">{note}</span>}
    </SideCard>
  );
}

/** "Publishing uses 1 of your N job credits", from GET /payments/status. */
export function CreditsLine({ credits }) {
  let text;
  if (credits.loading && !credits.quota) text = 'Checking your job credits…';
  else if (credits.error) text = `Job credits: ${credits.error}`;
  else if (!credits.quota) text = 'The server did not return your job credits.';
  else if (credits.quota.remainingJobs > 0) text = `Publishing uses 1 of your ${nf(credits.quota.remainingJobs)} job credit${credits.quota.remainingJobs === 1 ? '' : 's'}`;
  else text = 'You have no job credits left. You can buy more on the last step.';
  const problem = credits.error || (credits.quota && credits.quota.remainingJobs <= 0);
  return (
    <div className={`flex items-center gap-2 border-t border-[#EEF0F3] pt-3 ${problem ? 'text-[#B91C1C]' : MUTED}`}>
      <AccountIcon name="card" size={16} />
      <span>{text}</span>
    </div>
  );
}

/** Running summary of the draft. `variant` decides which lines a step shows. */
export function SummaryCard({ values, variant, credits, onEditBasics }) {
  const title = values.title.trim();
  return (
    <SideCard
      id="summary-title"
      title={variant === 'skills' ? 'Basics' : 'Summary'}
      action={variant === 'skills' ? <TextButton onClick={onEditBasics}>Edit</TextButton> : null}
    >
      <span className={`text-base font-semibold ${title ? '' : MUTED}`}>{title || 'Job title not added yet'}</span>
      {variant === 'process' ? (
        <>
          <span className={MUTED}>
            {typeLine(values)} · {values.workMode} · {openingsLine(values)}
          </span>
          <span className={MUTED}>
            {payLine(values)} · {joiningLine(values)}
          </span>
          <span className={MUTED}>Open for {values.activeDays || 0} days</span>
        </>
      ) : (
        <>
          <span className={MUTED}>
            {typeLine(values)} · {values.workMode}
          </span>
          <span className={MUTED}>
            {values.location.trim() || 'Location not added'} · {openingsLine(values)}
          </span>
          {variant === 'pay' ? (
            values.requirements.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {values.requirements.map((req) => (
                  <Chip key={req.skillName}>{barsLine(req)}</Chip>
                ))}
              </div>
            )
          ) : (
            <span className={MUTED}>
              {values.preferredEducation} · {values.desiredExperience}
            </span>
          )}
          {(variant === 'basics' || variant === 'skills') && <CreditsLine credits={credits} />}
        </>
      )}
    </SideCard>
  );
}
