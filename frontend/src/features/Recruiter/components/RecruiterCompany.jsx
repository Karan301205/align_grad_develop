import React from 'react';
import { CheckCircle } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function RecruiterCompany({ company, docLink, setDocLink, submittingDoc, handleVerification }) {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Trust Verification"
        subtitle="Upload incorporation or tax documents to unlock candidate matches"
      />

      <Card padding="p-8" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
          <div>
            <h4 className="text-lg font-bold text-on-surface">Trust & Safety Rating</h4>
            <p className="text-xs text-on-surface-variant mt-1">Requirement for posting verified candidate matching pipelines</p>
          </div>
          {company?.verified ? (
            <Badge variant="success" icon={CheckCircle}>Verified</Badge>
          ) : (
            <Badge variant="error">Unverified</Badge>
          )}
        </div>

        {!company?.verified && (
          <form onSubmit={handleVerification} className="space-y-4">
            <Input
              label="Corporate Document Link"
              type="url"
              placeholder="https://example.com/legal_incorporation_doc.pdf"
              value={docLink}
              onChange={e => setDocLink(e.target.value)}
              required
            />
            <Button type="submit" loading={submittingDoc} fullWidth>
              Submit Verification Documents
            </Button>
          </form>
        )}

        {company?.verified && (
          <div className="p-4 bg-success-container border border-success/20 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-on-success-container text-sm">Trust established</h5>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Your company account is fully verified. Candidates matching your skill thresholds will see a verification badge and will be allowed to submit applications directly.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
