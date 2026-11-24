import { SelectControl } from '../../components/AccountControls';
import { MUTED } from '../../components/accountStyles';
import { controlClass, errorProps } from '../../components/formControls';
import { EDUCATION_OPTIONS, EXPERIENCE_OPTIONS, HOURS, OPPORTUNITY_TYPES, WORK_MODE_OPTIONS } from '../constants';
import { keepDigits, keepTitleChars, keepUrlChars } from '../validation';
import { Field, PillGroup, RequiredMark, StepFooter, StepPanel } from '../components/ui';

const asOptions = (list) => list.map((item) => [item, item]);

function OpeningsStepper({ value, onChange, error }) {
  const count = Number(value) || 0;
  const stepButton = 'size-11 rounded-[8px] border border-[#D5D9E0] bg-white font-(family-name:--font-headline) text-lg font-semibold hover:bg-[#F4F8F6] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55]';
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Fewer openings" disabled={count <= 1} onClick={() => onChange(String(Math.max(1, count - 1)))} className={stepButton}>
        −
      </button>
      <input
        id="openings"
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(keepDigits(event.target.value).slice(0, 4))}
        {...errorProps('openings', error)}
        className={controlClass(error, 'h-11 max-w-16 px-2 text-center text-lg font-bold tabular-nums')}
      />
      <button type="button" aria-label="More openings" onClick={() => onChange(String(count + 1))} className={stepButton}>
        +
      </button>
    </div>
  );
}

export default function BasicsStep({ form, onCancel }) {
  const { values: v, setField, errors } = form;
  return (
    <StepPanel id="step-title" title="What are you hiring for?">
      <div className="-mt-3.5" />

      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 p-0 font-semibold">
          Type of opportunity
          <RequiredMark />
        </legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-2">
          {OPPORTUNITY_TYPES.map((type) => {
            const pressed = v.opportunityType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                aria-pressed={pressed}
                onClick={() => setField('opportunityType', type.value)}
                className={`flex flex-col items-start gap-0.5 rounded-[10px] text-left font-(family-name:--font-headline) text-sm text-[#023836] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55] ${
                  pressed ? 'border-2 border-[#0F7A55] bg-[#E3F1EE] px-[13px] py-[11px]' : 'border border-[#D5D9E0] bg-white px-3.5 py-3 hover:bg-[#F4F8F6]'
                }`}
              >
                <span className="font-semibold">{type.title}</span>
                <span className={`text-[13px] font-normal ${MUTED}`}>{type.desc}</span>
              </button>
            );
          })}
        </div>
        <PillGroup label="Hours" required options={HOURS} value={v.hours} onChange={(hours) => setField('hours', hours)} />
      </fieldset>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-[18px] gap-y-4">
        <Field id="title" label="Job title" required error={errors.title}>
          <input
            id="title"
            type="text"
            maxLength={120}
            placeholder="e.g. Data Analyst – Fresher"
            value={v.title}
            onChange={(event) => setField('title', keepTitleChars(event.target.value))}
            {...errorProps('title', errors.title)}
            className={controlClass(errors.title)}
          />
        </Field>
        <Field id="workMode" label="Work mode" required>
          <SelectControl id="workMode" value={v.workMode} options={asOptions(WORK_MODE_OPTIONS)} onChange={(value) => setField('workMode', value)} />
        </Field>
        <Field id="location" label="Location" required error={errors.location} hint="Filled in from your company profile. Change it if the job is elsewhere.">
          <input
            id="location"
            type="text"
            maxLength={150}
            placeholder="e.g. Nizampet, Hyderabad"
            value={v.location}
            onChange={(event) => setField('location', event.target.value)}
            {...errorProps('location', errors.location)}
            className={controlClass(errors.location)}
          />
        </Field>
        <Field id="locationUrl" label="Office map link" error={errors.locationUrl}>
          <input
            id="locationUrl"
            type="text"
            inputMode="url"
            placeholder="https://maps.google.com/…"
            value={v.locationUrl}
            onChange={(event) => setField('locationUrl', keepUrlChars(event.target.value))}
            {...errorProps('locationUrl', errors.locationUrl)}
            className={controlClass(errors.locationUrl)}
          />
        </Field>
        <Field id="openings" label="Openings" required error={errors.openings}>
          <OpeningsStepper value={v.openings} onChange={(value) => setField('openings', value)} error={errors.openings} />
        </Field>
        <Field id="preferredEducation" label="Education" required>
          <SelectControl id="preferredEducation" value={v.preferredEducation} options={asOptions(EDUCATION_OPTIONS)} onChange={(value) => setField('preferredEducation', value)} />
        </Field>
        <Field id="desiredExperience" label="Experience" required>
          <SelectControl id="desiredExperience" value={v.desiredExperience} options={asOptions(EXPERIENCE_OPTIONS)} onChange={(value) => setField('desiredExperience', value)} />
        </Field>
      </div>

      <StepFooter backLabel="Cancel" onBack={onCancel} nextLabel="Continue" onNext={form.next} />
    </StepPanel>
  );
}
