import { ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Notice from '../../components/ui/Notice.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import { formatDateTime } from '../../utils/format.js';
import { verificationMeta } from '../../utils/verification.js';
import DocumentLinks from './DocumentLinks.jsx';

/**
 * The Verification tab: status history and the documents, read-only. Approving or rejecting
 * happens on the Overview tab; `onOpenOverview` takes you there.
 */
export default function VerificationPanel({ company, onOpenOverview }) {
  const meta = verificationMeta(company.verificationStatus);
  const docs = company.verificationDocs || [];
  const submittedAt = formatDateTime(company.verificationSubmittedAt);
  const reviewedAt = formatDateTime(company.verificationReviewedAt);

  return (
    <div className="space-y-4">
      <Notice
        tone="info"
        action={
          <Button size="sm" icon={ArrowRight} onClick={onOpenOverview}>
            Go to Overview
          </Button>
        }
      >
        Approve or reject this company from the Overview tab.
      </Notice>

      <Panel>
        <PanelHeader
          title="Verification status"
          action={<Pill tone={meta.tone}>{meta.label}</Pill>}
          subtitle={[submittedAt && `Submitted ${submittedAt}`, reviewedAt && `Reviewed ${reviewedAt}${company.verificationReviewedBy ? ` by ${company.verificationReviewedBy}` : ''}`]
            .filter(Boolean)
            .join(' · ')}
        />
        {company.verificationStatus === 'REJECTED' && company.verificationNote && (
          <PanelBody>
            <Notice tone="error">
              <span className="block text-xs font-bold uppercase tracking-wide">Rejection reason sent to the recruiter</span>
              <span className="mt-1 block whitespace-pre-line font-normal">{company.verificationNote}</span>
            </Notice>
          </PanelBody>
        )}
      </Panel>

      <Panel>
        <PanelHeader title={`Verification documents (${docs.length})`} subtitle="Legal documents the recruiter uploaded to prove the company is real" />
        <PanelBody>
          <DocumentLinks docs={docs} />
        </PanelBody>
      </Panel>
    </div>
  );
}
