import { useRef } from 'react';
import { formatShortDate } from '../../../../utils/format';
import AccountIcon from '../../components/AccountIcon';
import { LINK, MUTED, PRIMARY_BUTTON } from '../../components/accountStyles';
import { REQUIRED_DOCS, VERIFICATION_DOC_TYPES } from '../constants';
import { Card, CardTitle, LockedNote } from './ui';
import { FieldError, SelectControl, Spinner } from '../../components/AccountControls';

function DocTile({ doc, submittedOn, onRemove }) {
  const meta = [doc.fileName, submittedOn && `submitted ${submittedOn}`].filter(Boolean).join(' · ');
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-[10px] border border-[#E4E6EA] p-3.5">
      <AccountIcon name="file" size={22} strokeWidth={1.6} className={MUTED} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{doc.docType}</span>
        {meta && <span className={`truncate text-[13px] ${MUTED}`}>{meta}</span>}
      </div>
      <a href={doc.docUrl} target="_blank" rel="noopener noreferrer" className={LINK} aria-label={`View ${doc.docType}`}>
        View
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-[4px] font-(family-name:--font-headline) text-sm font-semibold text-[#B91C1C] hover:text-[#7F1D1D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]"
          aria-label={`Remove ${doc.docType}`}
        >
          Remove
        </button>
      )}
    </li>
  );
}

function DocUploader({ docs, docType, setDocType, uploading, onUpload, error }) {
  const fileInput = useRef(null);
  const available = VERIFICATION_DOC_TYPES.filter((type) => !docs.some((doc) => doc.docType === type));
  return (
    <div id="field-verification" className="flex flex-col gap-1.5">
      <label htmlFor="docType" className="font-semibold">
        Document type <span className="text-[#B91C1C]">*</span>
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="min-w-0 flex-1">
          <SelectControl id="docType" value={docType} options={available.map((type) => [type, type])} onChange={setDocType} disabled={uploading} error={error} />
        </div>
        <input ref={fileInput} type="file" accept="application/pdf" className="hidden" onChange={onUpload} />
        <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className={`${PRIMARY_BUTTON} h-11 px-4`}>
          {uploading ? <Spinner /> : <AccountIcon name="upload" size={16} />}
          {uploading ? 'Uploading…' : 'Upload PDF'}
        </button>
      </div>
      {error ? (
        <FieldError id="docType-error">{error}</FieldError>
      ) : (
        <span className={`text-[13px] ${MUTED}`}>PDF up to 10MB. Add {REQUIRED_DOCS} different documents, one at a time.</span>
      )}
    </div>
  );
}

/** Legal documents for verification: tiles with View (and Remove while editable) plus the uploader. */
export default function DocumentsCard({ docs, locked, lockedLabel, submittedAt, docType, setDocType, uploading, onUpload, onRemove, error }) {
  const submittedOn = locked ? formatShortDate(submittedAt) : '';
  return (
    <Card labelledBy="documents-title" className="gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <CardTitle id="documents-title">Verification documents</CardTitle>
        {locked ? <LockedNote>{lockedLabel}</LockedNote> : <span className={`text-[13px] ${MUTED}`}>{docs.length} of {REQUIRED_DOCS} added</span>}
      </div>

      {docs.length > 0 ? (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3 p-0">
          {docs.map((doc, index) => (
            <DocTile key={`${doc.docType}-${doc.docUrl}`} doc={doc} submittedOn={submittedOn} onRemove={locked ? null : () => onRemove(index)} />
          ))}
        </ul>
      ) : (
        <p className={`m-0 ${MUTED}`}>{locked ? 'No documents on file.' : 'No documents added yet.'}</p>
      )}

      {!locked && docs.length < REQUIRED_DOCS && (
        <DocUploader docs={docs} docType={docType} setDocType={setDocType} uploading={uploading} onUpload={onUpload} error={error} />
      )}
    </Card>
  );
}
