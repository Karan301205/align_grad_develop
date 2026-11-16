import { Download } from 'lucide-react';
import SafeLink from '../../components/SafeLink.jsx';

/** The legal documents a recruiter uploaded, as links that open in a new tab. */
export default function DocumentLinks({ docs, empty = 'No verification documents uploaded.' }) {
  if (docs.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {docs.map((doc, index) => {
        const name = doc.fileName ? `${doc.docType} (${doc.fileName})` : doc.docType;
        // min-w-0 / max-w-full let a very long file name shrink with an ellipsis instead of widening the page
        return (
          <li key={`${doc.docUrl}-${index}`} className="min-w-0 max-w-full">
            <SafeLink href={doc.docUrl} icon={Download} title={name} className="rounded-lg border border-line-strong bg-panel px-3 py-2 hover:bg-subtle">
              {doc.docType}
              {doc.fileName && <span className="font-normal text-muted"> ({doc.fileName})</span>}
            </SafeLink>
          </li>
        );
      })}
    </ul>
  );
}
