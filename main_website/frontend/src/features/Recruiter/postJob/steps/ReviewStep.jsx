import { FieldError, Spinner } from '../../components/AccountControls';
import { MUTED, PRIMARY_BUTTON } from '../../components/accountStyles';
import { formatInr } from '../../../../utils/format';
import { STEPS } from '../constants';
import { barsLine, durationLine, openingsLine, payLine, processLine, typeLine } from '../summary';
import { closingDate } from '../validation';
import { Chip, RequiredMark, StepFooter, StepPanel, TextButton } from '../components/ui';

function ReviewRow({ title, onEdit, children }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[10px] border border-[#E4E6EA] p-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="font-semibold">{title}</span>
        {children}
      </div>
      <TextButton onClick={onEdit} className="shrink-0" aria-label={`Edit ${title}`}>
        Edit
      </TextButton>
    </div>
  );
}

function PublishAction({ credits, submitting, confirmed, onPublish, onBuyCredits }) {
  const remaining = credits.quota?.remainingJobs;
  const offer = credits.offer;
  if (credits.quota && remaining <= 0) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[#B91C1C]">You have no job credits left.</span>
        {offer?.jobCredits ? (
          <button type="button" onClick={onBuyCredits} className={`${PRIMARY_BUTTON} h-11 px-5`}>
            Buy {offer.jobCredits} job credits · {formatInr(offer.amount)}
          </button>
        ) : (
          <span className="text-[#B91C1C]">Credit packs are not available right now.</span>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={credits.error ? 'text-[#B91C1C]' : MUTED}>
        {credits.error
          ? `Couldn’t check your job credits. ${credits.error}`
          : credits.quota
            ? `Uses 1 of your ${remaining} job credit${remaining === 1 ? '' : 's'}`
            : 'Checking your job credits…'}
      </span>
      <button type="button" onClick={onPublish} disabled={submitting || !confirmed} className={`${PRIMARY_BUTTON} h-11 px-[22px] disabled:bg-[#9CA3AF] disabled:opacity-100`}>
        {submitting && <Spinner />}
        {submitting ? 'Publishing…' : 'Publish job'}
      </button>
    </div>
  );
}

export default function ReviewStep({ form, company, pool, credits, onBuyCredits }) {
  const { values: v, setField, errors, goTo, submitError } = form;
  const edit = (id) => () => goTo(STEPS.findIndex((step) => step.id === id));
  const closes = closingDate(v.activeDays);
  const bars = v.requirements.length;

  return (
    <StepPanel id="step-title" title="Review and publish" intro="Check each part before you publish. On the right is how the main details will look to candidates.">
      <div className="flex flex-col gap-2.5">
        <ReviewRow title="Basics" onEdit={edit('basics')}>
          <span className={MUTED}>
            {[v.title.trim(), typeLine(v), v.workMode, v.location.trim(), openingsLine(v), v.preferredEducation, v.desiredExperience].join(' · ')}
          </span>
        </ReviewRow>
        <ReviewRow title="Skills & bars" onEdit={edit('skills')}>
          <div className="flex flex-wrap gap-1.5">
            {v.requirements.map((req) => (
              <Chip key={req.skillName}>{barsLine(req)}</Chip>
            ))}
          </div>
          <span className={MUTED}>
            {pool.status === 'ready'
              ? `${pool.data.eligible.toLocaleString('en-IN')} candidate${pool.data.eligible === 1 ? '' : 's'} meet ${bars === 1 ? 'this bar' : `all ${bars} bars`} today`
              : pool.status === 'error'
                ? `Couldn’t count matching candidates. ${pool.error}`
                : 'Counting matching candidates…'}
          </span>
        </ReviewRow>
        <ReviewRow title="Pay & dates" onEdit={edit('pay')}>
          <span className={MUTED}>
            {[
              `${payLine(v)}${v.showSalary ? ', shown to candidates' : ''}`,
              durationLine(v),
              `Joining: ${v.joiningMonth}`,
              `Open for ${v.activeDays} days${closes ? `, removed on ${closes}` : ''}`
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </ReviewRow>
        <ReviewRow title="Hiring process" onEdit={edit('process')}>
          <span className={MUTED}>{processLine(v)}</span>
        </ReviewRow>
      </div>

      <p className="m-0 rounded-[10px] bg-[#F4F8F6] px-4 py-3.5 text-[#334155]">
        Candidates below a bar that has a skill test can’t apply. They see which skills fall short and can take the test again to qualify.
      </p>

      <div id="field-confirmed" className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={v.confirmed}
            onChange={(event) => setField('confirmed', event.target.checked)}
            className="mt-0.5 size-[18px] shrink-0 accent-[#0F7A55]"
          />
          <span>
            This is a real, open position at {company?.name || 'your company'}, and candidates won’t be asked to pay anything to apply or join.
            <RequiredMark />
          </span>
        </label>
        {errors.confirmed && <FieldError id="confirmed-error">{errors.confirmed}</FieldError>}
      </div>

      {submitError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[#7F1D1D]">
          <span>{submitError.message}</span>
          {submitError.stepIndex != null && (
            <TextButton onClick={() => goTo(submitError.stepIndex)}>Go to {STEPS[submitError.stepIndex].title}</TextButton>
          )}
        </div>
      )}

      <StepFooter onBack={form.back}>
        <PublishAction credits={credits} submitting={form.submitting} confirmed={v.confirmed} onPublish={form.publish} onBuyCredits={onBuyCredits} />
      </StepFooter>
    </StepPanel>
  );
}
