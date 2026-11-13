import { useState } from 'react';
import { LIMITS, cleanLine, cleanMultiline, cleanUrl, errorCount, normalizeUrl, textError, urlError } from '../profileRules';
import { ConfirmDialog, Dialog, DialogFooter, ErrorBanner, Field, TextArea, TextInput } from '../ui';

const EMPTY = { activity: '', link: '', description: '' };

/** Add / edit an activity (design: Web — add education … dialog, Activity form). */
export default function ActivityDialog({ activity, onSave, onRemove, onClose }) {
  const editing = Boolean(activity);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(activity || {}) }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const set = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const save = async () => {
    setError('');
    const next = {
      activity: textError(form.activity, { field: 'what you did', name: 'activity', required: true, max: LIMITS.activity }),
      description: textError(form.description, { field: 'the line about it', name: 'description', max: LIMITS.activityLine }),
      link: urlError(form.link, { field: 'link' })
    };
    setErrors(next);
    if (errorCount(next)) {
      setError('Some details need fixing.');
      return;
    }
    setBusy(true);
    const result = await onSave({ ...form, activity: form.activity.trim(), description: form.description.trim(), link: form.link ? normalizeUrl(form.link) : '' });
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
      title={editing ? 'Edit activity' : 'Add an activity'}
      subtitle="Clubs, sports, volunteering, events, leadership"
      onClose={onClose}
      busy={busy}
      footer={<DialogFooter busy={busy} onCancel={onClose} onSave={save} onRemove={editing ? () => setConfirmRemove(true) : null} />}
    >
      <ErrorBanner message={error} />
      <Field id="activity-title" label="What you did" required error={errors.activity}>
        <TextInput id="activity-title" data-autofocus value={form.activity} onChange={set('activity')} clean={cleanLine} maxLength={LIMITS.activity} error={errors.activity} placeholder="e.g. Coordinator, college tech fest" />
      </Field>
      <Field
        id="activity-line"
        label="A line about it"
        error={errors.description}
        counter={{ text: `${form.description.trim().length}/${LIMITS.activityLine}`, over: form.description.trim().length > LIMITS.activityLine }}
      >
        <TextArea id="activity-line" rows={3} value={form.description} onChange={set('description')} clean={cleanMultiline} error={errors.description} placeholder="e.g. Led a team of 12 volunteers and ran ticket sales for a 2-day event." />
      </Field>
      <Field id="activity-link" label="Link" error={errors.link}>
        <TextInput id="activity-link" type="url" inputMode="url" value={form.link} onChange={set('link')} clean={cleanUrl} maxLength={LIMITS.url} error={errors.link} onBlur={() => form.link && !urlError(form.link) && set('link')(normalizeUrl(form.link))} placeholder="Photos, certificate or news link" />
      </Field>

      {confirmRemove && (
        <ConfirmDialog title="Remove this activity?" tone="danger" confirmLabel="Remove" busyLabel="Removing…" busy={busy} onConfirm={remove} onClose={() => setConfirmRemove(false)}>
          “{activity?.activity}” will be taken off your profile.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
