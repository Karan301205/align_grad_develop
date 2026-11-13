import { useState } from 'react';
import { DRIVE_HOSTS, LIMITS, cleanUrl, normalizeUrl, urlError } from '../profileRules';
import { BODY } from '../profileTheme';
import { ConfirmDialog, Dialog, DialogFooter, ErrorBanner, Field, TextInput } from '../ui';

/** "Use my own" resume: a Google Drive link saved as the profile's resumeUrl. */
export default function ResumeLinkDialog({ resumeUrl, onSave, onClose }) {
  const [link, setLink] = useState(resumeUrl || '');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const run = async (value) => {
    setBusy(true);
    setError('');
    const result = await onSave(value);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      setConfirmRemove(false);
    }
  };

  const save = () => {
    const message = link.trim() ? urlError(link, { field: 'Google Drive link', hosts: DRIVE_HOSTS }) : 'Enter your Google Drive link.';
    setFieldError(message);
    if (!message) run(normalizeUrl(link));
  };

  return (
    <Dialog
      title="Use your own resume"
      subtitle="Recruiters can open this alongside your AlignGrad resume."
      onClose={onClose}
      busy={busy}
      width="max-w-[520px]"
      footer={<DialogFooter busy={busy} saveLabel="Save link" onCancel={onClose} onSave={save} onRemove={resumeUrl ? () => setConfirmRemove(true) : null} removeLabel="Remove link" />}
    >
      <ErrorBanner message={error} />
      <Field id="resume-link" label="Google Drive link" required error={fieldError} hint="Set the file to “Anyone with the link can view”.">
        <TextInput
          id="resume-link"
          data-autofocus
          type="url"
          inputMode="url"
          value={link}
          onChange={(value) => {
            setLink(value);
            setFieldError('');
          }}
          clean={cleanUrl}
          maxLength={LIMITS.url}
          error={fieldError}
          hint="drive"
          placeholder="https://drive.google.com/file/d/…"
        />
      </Field>
      <p className={`m-0 rounded-[12px] bg-[#F4F6FE] px-3.5 py-3 ${BODY}`}>Only Google Drive and Google Docs links are accepted.</p>
      {confirmRemove && (
        <ConfirmDialog title="Remove your resume link?" tone="danger" confirmLabel="Remove link" busyLabel="Removing…" busy={busy} onConfirm={() => run('')} onClose={() => setConfirmRemove(false)}>
          Recruiters will only see the resume built from your profile.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
