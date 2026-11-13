import { SelectControl } from '../../components/AccountControls';
import { MUTED } from '../../components/accountStyles';
import { JOINING_OPTIONS, opportunityMeta } from '../constants';
import { closingDate, formatAmount, keepDigits } from '../validation';
import { AddonInput, Field, StepFooter, StepPanel, Switch } from '../components/ui';

export default function PayStep({ form }) {
  const { values: v, setField, errors } = form;
  const meta = opportunityMeta(v.opportunityType);
  const isInternship = v.opportunityType === 'INTERNSHIP';
  const closes = closingDate(v.activeDays);

  return (
    <StepPanel id="step-title" title="Pay and dates" intro="Showing pay helps freshers decide quickly. You can hide it if you prefer.">
      <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[#E4E6EA] bg-[#F8F8F6] px-4 py-3">
        <div className="flex flex-col">
          <span className="font-semibold">Show {meta.pay.toLowerCase()} to candidates</span>
          <span className={`text-[13px] ${MUTED}`}>
            {v.showSalary ? 'Candidates see the amount on the job post' : `Candidates see “${meta.pay} Undisclosed”`}
          </span>
        </div>
        <Switch checked={v.showSalary} onChange={(on) => setField('showSalary', on)} label={`Show ${meta.pay.toLowerCase()} to candidates`} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-x-[18px] gap-y-4">
        <Field id="salary" label={`${meta.pay} per month`} optional hint={`${v.hours} ${meta.noun}, as set in Basics.`}>
          <AddonInput
            id="salary"
            prefix="₹"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 25,000"
            value={formatAmount(v.salary)}
            onChange={(event) => setField('salary', keepDigits(event.target.value).slice(0, 9))}
          />
        </Field>
        {isInternship && (
          <Field id="duration" label="Duration" required error={errors.duration}>
            <AddonInput
              id="duration"
              suffix="months"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 6"
              value={v.duration}
              error={errors.duration}
              onChange={(event) => setField('duration', keepDigits(event.target.value).slice(0, 2))}
            />
          </Field>
        )}
        <Field id="joiningMonth" label="Joining" required hint="Final-year students usually join after exams.">
          <SelectControl id="joiningMonth" value={v.joiningMonth} options={JOINING_OPTIONS.map((option) => [option, option])} onChange={(value) => setField('joiningMonth', value)} />
        </Field>
        <Field
          id="activeDays"
          label="Keep the listing open for"
          required
          error={errors.activeDays}
          hint={closes ? `Removed automatically on ${closes}, with its applications. You can change this later by editing the job.` : null}
        >
          <AddonInput
            id="activeDays"
            suffix="days"
            type="text"
            inputMode="numeric"
            value={v.activeDays}
            error={errors.activeDays}
            onChange={(event) => setField('activeDays', keepDigits(event.target.value).slice(0, 3))}
          />
        </Field>
      </div>

      <StepFooter onBack={form.back} nextLabel="Continue to hiring process" onNext={form.next} />
    </StepPanel>
  );
}
