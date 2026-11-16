import { useEffect, useState } from 'react';
import { CircleCheck, CircleX, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import Button from '../../components/ui/Button.jsx';
import Field, { inputClass } from '../../components/ui/Field.jsx';
import Notice from '../../components/ui/Notice.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import { availableDecisions, rejectionReasonProblem, verificationMeta } from '../../utils/verification.js';
import DocumentLinks from './DocumentLinks.jsx';

/**
 * The approve / reject decision for one company, with its documents beside it. This is the only
 * place the decision buttons live (the Overview tab). `onUpdated(company)` receives the company
 * as the server saved it. `onDraftChange(true)` is called while the rejection form is open, so a
 * drawer around the card can ignore stray clicks outside it instead of throwing the reason away.
 */
export default function DecisionCard({ company, onUpdated, onDraftChange }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(null); // 'APPROVE' | 'REJECT' | null
  const [feedback, setFeedback] = useState(null); // { tone, message }

  // The form opening or closing is reported in the same click that does it. When the card goes away
  // (another tab or company), "no draft" is reported too. `onDraftChange` must be a stable function.
  const setRejectFormOpen = (open) => {
    setShowRejectForm(open);
    onDraftChange?.(open);
  };
  useEffect(() => () => onDraftChange?.(false), [onDraftChange]);

  const meta = verificationMeta(company.verificationStatus);
  const { canApprove, canReject } = availableDecisions(company);
  const docs = company.verificationDocs || [];

  const decide = async (decision) => {
    if (decision === 'REJECT') {
      const problem = rejectionReasonProblem(reason);
      if (problem) {
        setFeedback({ tone: 'error', message: problem });
        return;
      }
    }

    setSubmitting(decision);
    setFeedback(null);
    try {
      const data = await adminApi.reviewRecruiterVerification(company.id, decision, decision === 'REJECT' ? reason.trim() : undefined);
      if (!data.success) {
        setFeedback({ tone: 'error', message: data.error || 'Failed to update verification status.' });
        return;
      }
      const updated = data.recruiter;
      onUpdated(updated);
      setRejectFormOpen(false);
      setReason('');
      const outcome = decision === 'APPROVE' ? 'approved' : 'rejected';
      setFeedback(
        data.emailSent
          ? { tone: 'success', message: `Company ${outcome}. A notification email was sent to ${updated.email}.` }
          : {
              tone: 'warning',
              message: `Company ${outcome}, but the notification email could not be sent (${data.emailError || 'unknown error'}). Please contact ${updated.email} manually.`
            }
      );
    } catch (err) {
      console.error('Error reviewing recruiter verification:', err);
      setFeedback({ tone: 'error', message: err.message || 'Network error while updating verification status.' });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Panel>
      <PanelHeader
        icon={ShieldCheck}
        title="Verification decision"
        subtitle="Check the documents, then decide. The recruiter is emailed either way."
        action={<Pill tone={meta.tone}>{meta.label}</Pill>}
      />
      <PanelBody className="space-y-4">
        {company.verificationStatus === 'REJECTED' && company.verificationNote && (
          <Notice tone="error">
            <span className="block text-xs font-bold uppercase tracking-wide">Rejection reason sent to the recruiter</span>
            <span className="mt-1 block whitespace-pre-line font-normal">{company.verificationNote}</span>
          </Notice>
        )}

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Documents ({docs.length})</h3>
          <DocumentLinks docs={docs} />
        </div>

        {!company.hasCompanyProfile ? (
          <Notice tone="info">This recruiter has not created a company profile yet, so there is nothing to approve or reject.</Notice>
        ) : (
          <>
            {docs.length === 0 && (
              <Notice tone="warning">
                No verification documents yet. You can still approve or reject the profile; the recruiter is notified by email either way.
              </Notice>
            )}
            {showRejectForm && (
              <Field label="Reason for rejection (emailed to the recruiter)" required>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="e.g. The GST certificate is unreadable. Please upload a clear copy."
                  className={`${inputClass} resize-y`}
                />
              </Field>
            )}
            {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}

            <div className="flex flex-col gap-2">
              {showRejectForm ? (
                <>
                  <Button variant="danger" icon={CircleX} loading={submitting === 'REJECT'} disabled={Boolean(submitting)} onClick={() => decide('REJECT')} className="w-full">
                    {submitting === 'REJECT' ? 'Rejecting…' : 'Confirm rejection & email'}
                  </Button>
                  <Button
                    disabled={Boolean(submitting)}
                    className="w-full"
                    onClick={() => {
                      setRejectFormOpen(false);
                      setReason('');
                      setFeedback(null);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  {canApprove && (
                    <Button variant="good" icon={CircleCheck} loading={submitting === 'APPROVE'} disabled={Boolean(submitting)} onClick={() => decide('APPROVE')} className="w-full">
                      {submitting === 'APPROVE' ? 'Approving…' : 'Approve & email recruiter'}
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      variant="danger"
                      icon={CircleX}
                      disabled={Boolean(submitting)}
                      className="w-full"
                      onClick={() => {
                        setRejectFormOpen(true);
                        setFeedback(null);
                      }}
                    >
                      {company.verificationStatus === 'APPROVED' ? 'Revoke approval' : 'Reject'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </PanelBody>
    </Panel>
  );
}
