import { useState } from 'react';
import { DOMAIN_OPTIONS } from '../../../../constants/domains';
import { DATE_MAX, DATE_MIN, dateBound, toDateInputValue } from '../../../../utils/dateInput';
import { EXPERIENCE_TYPES, LIMITS, cleanMultiline, cleanPlace, cleanRole, errorCount, rangeErrors, textError } from '../profileRules';
import { BODY } from '../profileTheme';
import { Checkbox, ComboInput, ConfirmDialog, Dialog, DialogFooter, ErrorBanner, Field, PillGroup, TextArea, TextInput } from '../ui';

const DOMAINS = DOMAIN_OPTIONS.filter((option) => option !== 'Other');

const EMPTY = { expType: '', designation: '', involvesTech: false, companyName: '', domain: '', startDate: '', endDate: '', currentlyWorking: false, location: '', description: '' };

/** Add / edit experience (design: Web — add education … dialog, Experience form). */
export default function ExperienceDialog({ experience, onSave, onRemove, onClose }) {
  const editing = Boolean(experience);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(experience || {}) }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const set = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const range = rangeErrors({ start: form.startDate, end: form.endDate, ongoing: form.currentlyWorking, startLabel: 'start date', endLabel: 'end date', endNotFuture: true });
    const next = {
      expType: form.expType ? '' : 'Choose the type.',
      designation: textError(form.designation, { field: 'your role', required: true, max: LIMITS.role }),
      companyName: textError(form.companyName, { field: 'the company name', required: true, max: LIMITS.company }),
      domain: textError(form.domain, { field: 'the domain', max: LIMITS.domain }),
      location: textError(form.location, { field: 'the location', max: LIMITS.location }),
      startDate: range.start,
      endDate: range.end,
      description: textError(form.description, { field: 'what you did', name: 'description', required: true, min: 20, max: LIMITS.description })
    };
    setErrors(next);
    return errorCount(next) === 0;
  };

  const save = async () => {
    setError('');
    if (!validate()) {
      setError('Some details need fixing.');
      return;
    }
    setBusy(true);
    const result = await onSave({
      ...form,
      designation: form.designation.trim(),
      companyName: form.companyName.trim(),
      domain: form.domain.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      startDate: toDateInputValue(form.startDate),
      endDate: form.currentlyWorking ? '' : toDateInputValue(form.endDate)
    });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    const result = await onRemove();
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      setConfirmRemove(false);
    }
  };

  return (
    <Dialog
      title={editing ? 'Edit experience' : 'Add experience'}
      subtitle="Internships, part-time work or freelancing"
      onClose={onClose}
      busy={busy}
      footer={<DialogFooter busy={busy} onCancel={onClose} onSave={save} onRemove={editing ? () => setConfirmRemove(true) : null} />}
    >
      <ErrorBanner message={error} />
      <PillGroup id="exp-type" legend="Type" required options={EXPERIENCE_TYPES} value={form.expType} onChange={set('expType')} error={errors.expType} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="exp-role" label="Your role" required error={errors.designation}>
          <TextInput id="exp-role" value={form.designation} onChange={set('designation')} clean={cleanRole} maxLength={LIMITS.role} error={errors.designation} placeholder="e.g. Data analyst intern" />
        </Field>
        <Field id="exp-company" label="Company or organisation" required error={errors.companyName}>
          <TextInput id="exp-company" value={form.companyName} onChange={set('companyName')} clean={cleanRole} maxLength={LIMITS.company} error={errors.companyName} placeholder="e.g. a startup, a local business" />
        </Field>
        <Field id="exp-domain" label="Domain" error={errors.domain}>
          <ComboInput id="exp-domain" value={form.domain} onChange={set('domain')} suggestions={DOMAINS} clean={(value) => cleanPlace(value)} maxLength={LIMITS.domain} error={errors.domain} placeholder="e.g. Data analytics" />
        </Field>
        <Field id="exp-location" label="Location" error={errors.location}>
          <TextInput id="exp-location" value={form.location} onChange={set('location')} clean={(value) => cleanPlace(value)} maxLength={LIMITS.location} error={errors.location} placeholder="e.g. Hyderabad or Remote" />
        </Field>
        <Field id="exp-start" label="Started" required error={errors.startDate}>
          <TextInput id="exp-start" type="date" min={DATE_MIN} max={dateBound(form.endDate, DATE_MAX)} value={toDateInputValue(form.startDate)} onChange={set('startDate')} error={errors.startDate} />
        </Field>
        <Field id="exp-end" label="Ended" error={errors.endDate}>
          <TextInput id="exp-end" type="date" min={dateBound(form.startDate, DATE_MIN)} max={DATE_MAX} disabled={form.currentlyWorking} value={form.currentlyWorking ? '' : toDateInputValue(form.endDate)} onChange={set('endDate')} error={errors.endDate} />
        </Field>
      </div>
      <div className="-mt-2">
        <Checkbox id="exp-current" checked={form.currentlyWorking} onChange={(checked) => setForm((prev) => ({ ...prev, currentlyWorking: checked, endDate: checked ? '' : prev.endDate }))}>
          I still work here
        </Checkbox>
      </div>
      <Field
        id="exp-description"
        label="What you did"
        required
        error={errors.description}
        hint="One point per line."
        counter={{ text: `${form.description.trim().length}/${LIMITS.description}`, over: form.description.trim().length > LIMITS.description }}
      >
        <TextArea id="exp-description" value={form.description} onChange={set('description')} clean={cleanMultiline} rows={4} error={errors.description} hint="lines" placeholder="One point per line, e.g. Cleaned 3 months of sales data in Excel" />
      </Field>
      <p className={`m-0 rounded-[12px] bg-[#F4F6FE] px-3.5 py-3 ${BODY}`}>No work experience yet? That’s normal for freshers. Projects and skill scores count more on AlignGrad.</p>

      {confirmRemove && (
        <ConfirmDialog title="Remove this experience?" tone="danger" confirmLabel="Remove" busyLabel="Removing…" busy={busy} onConfirm={remove} onClose={() => setConfirmRemove(false)}>
          “{experience?.designation}” will be taken off your profile.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
