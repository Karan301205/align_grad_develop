import { useRef, useState } from 'react';
import { FileCheck2, Upload } from 'lucide-react';
import { userMessage } from '../../../../services/apiClient';
import { DATE_MIN, toDateInputValue, todayInputValue } from '../../../../utils/dateInput';
import { LIMITS, cleanDigits, cleanLine, cleanMultiline, cleanRole, cleanUrl, dateError, errorCount, normalizeUrl, textError, urlError } from '../profileRules';
import { DANGER_OUTLINE, MUTED, SECONDARY } from '../profileTheme';
import { ConfirmDialog, Dialog, DialogFooter, ErrorBanner, Field, TextArea, TextInput } from '../ui';
import { CERTIFICATE_FILE, readAsDataUrl } from '../uploads';

const EMPTY = { title: '', org: '', startDate: '', link: '', certNumber: '', attachment: '', description: '' };

/** Add / edit a certificate (design: Web — add education … dialog, Certificate form). */
export default function CertificateDialog({ certificate, onSave, onRemove, onClose }) {
  const editing = Boolean(certificate);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(certificate || {}) }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const fileRef = useRef(null);

  const set = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const pickFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!CERTIFICATE_FILE.types.includes(file.type)) {
      setErrors((prev) => ({ ...prev, attachment: 'Upload a PDF, JPG or PNG file.' }));
      return;
    }
    if (file.size > CERTIFICATE_FILE.maxBytes) {
      setErrors((prev) => ({ ...prev, attachment: 'Upload a file under 100 KB.' }));
      return;
    }
    setReading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      set('attachment')(dataUrl);
      setFileName(file.name);
    } catch (err) {
      setErrors((prev) => ({ ...prev, attachment: userMessage(err, 'This file couldn’t be read. Try again.') }));
    } finally {
      setReading(false);
    }
  };

  const validate = () => {
    const next = {
      title: textError(form.title, { field: 'the certificate name', required: true, max: LIMITS.title }),
      org: textError(form.org, { field: 'who issued it', name: 'issuer', required: true, max: LIMITS.company }),
      startDate: dateError(form.startDate, { field: 'issue date', notFuture: true }),
      link: urlError(form.link, { field: 'certificate link' }),
      certNumber: form.certNumber && form.certNumber.length > LIMITS.certId ? 'Enter a valid certificate ID.' : '',
      description: textError(form.description, { field: 'the description', max: 500, needLetter: true })
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
      title: form.title.trim(),
      org: form.org.trim(),
      startDate: toDateInputValue(form.startDate),
      link: form.link ? normalizeUrl(form.link) : '',
      description: form.description.trim()
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
      title={editing ? 'Edit certificate' : 'Add a certificate'}
      subtitle="Courses and credentials you’ve completed"
      onClose={onClose}
      busy={busy}
      footer={<DialogFooter busy={busy} disabled={reading} onCancel={onClose} onSave={save} onRemove={editing ? () => setConfirmRemove(true) : null} />}
    >
      <ErrorBanner message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cert-title" label="Certificate name" required error={errors.title}>
          <TextInput id="cert-title" data-autofocus value={form.title} onChange={set('title')} clean={cleanLine} maxLength={LIMITS.title} error={errors.title} placeholder="e.g. Data Analytics with Python" />
        </Field>
        <Field id="cert-org" label="Issued by" required error={errors.org}>
          <TextInput id="cert-org" value={form.org} onChange={set('org')} clean={cleanRole} maxLength={LIMITS.company} error={errors.org} placeholder="e.g. NPTEL, Coursera" />
        </Field>
        <Field id="cert-date" label="Issued on" error={errors.startDate}>
          <TextInput id="cert-date" type="date" min={DATE_MIN} max={todayInputValue()} value={toDateInputValue(form.startDate)} onChange={set('startDate')} error={errors.startDate} />
        </Field>
        <Field id="cert-id" label="Certificate ID" error={errors.certNumber} hint="Numbers only">
          <TextInput id="cert-id" inputMode="numeric" value={form.certNumber} onChange={set('certNumber')} clean={cleanDigits} maxLength={LIMITS.certId} error={errors.certNumber} hint="id" placeholder="The number printed on it" />
        </Field>
      </div>
      <Field id="cert-link" label="Link" error={errors.link}>
        <TextInput id="cert-link" type="url" inputMode="url" value={form.link} onChange={set('link')} clean={cleanUrl} maxLength={LIMITS.url} error={errors.link} onBlur={() => form.link && !urlError(form.link) && set('link')(normalizeUrl(form.link))} placeholder="https://…" />
      </Field>
      <Field id="cert-description" label="Description" error={errors.description}>
        <TextArea id="cert-description" rows={2} value={form.description} onChange={set('description')} clean={cleanMultiline} maxLength={500} error={errors.description} placeholder="What the course covered" />
      </Field>

      <input ref={fileRef} type="file" accept={CERTIFICATE_FILE.types.join(',')} className="hidden" tabIndex={-1} onChange={pickFile} />
      {form.attachment ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#BFE5D3] bg-[#F3FBF7] p-3.5">
          <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-[10px] bg-[#E3F5EE] text-[#0F7A55]">
            <FileCheck2 className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold">Certificate file attached</span>
            {fileName && <span className={`truncate text-[13px] ${MUTED}`}>{fileName}</span>}
          </span>
          <button type="button" onClick={() => fileRef.current?.click()} className={`${SECONDARY} h-10 px-3`}>
            Replace
          </button>
          <button type="button" onClick={() => { set('attachment')(''); setFileName(''); }} className={`${DANGER_OUTLINE} h-10 px-3`}>
            Remove
          </button>
        </div>
      ) : (
        <Field id="cert-file" error={errors.attachment}>
          <button
            id="cert-file"
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={reading}
            className="flex items-center gap-3.5 rounded-[12px] border border-dashed border-[#9AA6C8] bg-[linear-gradient(160deg,#F4F6FE,#F3FBF7)] p-4 text-left hover:border-[#0F7A55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]"
          >
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#E3F5EE] text-[#0F7A55]">
              <Upload className="size-5" />
            </span>
            <span className="flex flex-col">
              <span className="font-semibold">Upload the certificate</span>
              <span className={`text-[13px] ${MUTED}`}>PDF or a photo of it · up to 100 KB</span>
            </span>
          </button>
        </Field>
      )}

      {confirmRemove && (
        <ConfirmDialog title="Remove this certificate?" tone="danger" confirmLabel="Remove" busyLabel="Removing…" busy={busy} onConfirm={remove} onClose={() => setConfirmRemove(false)}>
          “{certificate?.title}” will be taken off your profile.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
