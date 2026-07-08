import React from 'react';
import { CheckCircle, UploadCloud } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

export default function RecruiterCompany({ company, submittingDoc, handleVerification }) {
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
          <div className="space-y-4">
            <label className="text-xs font-semibold text-on-surface-variant block mb-1">
              Upload Incorporation or Legal Document (PDF, max 10MB)
            </label>
            <div 
              onClick={() => document.getElementById('company-doc-upload').click()}
              className="border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer bg-surface-container-low transition-all hover:bg-surface-container flex flex-col items-center justify-center gap-2 group"
            >
              <input 
                id="company-doc-upload"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.type !== 'application/pdf') {
                    alert('Please upload a PDF file.');
                    return;
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    alert('File size exceeds the 10MB limit.');
                    return;
                  }
                  await handleVerification(file);
                }}
              />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-on-surface">Click to select legal document</p>
              <p className="text-[10px] text-on-surface-variant">PDF up to 10MB</p>
            </div>
            {submittingDoc && (
              <div className="text-center text-xs text-primary font-medium animate-pulse">
                Uploading and verifying document on S3...
              </div>
            )}
          </div>
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
