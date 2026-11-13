import { COMPANY_VERIFICATION_STATUS } from '../../../../utils/companyVerification';
import { formatShortDate } from '../../../../utils/format';
import { MUTED } from '../../components/accountStyles';
import { REQUIRED_DOCS } from '../constants';
import { Card } from './ui';

const { NOT_SUBMITTED, PENDING, APPROVED, REJECTED } = COMPANY_VERIFICATION_STATUS;

const TONES = {
  done: { bar: 'bg-[#1447E6]', label: '' },
  current: { bar: 'bg-[#D97706]', label: 'text-[#92400E]' },
  todo: { bar: 'bg-[#E4E6EA]', label: 'text-[#4B5563]' },
  error: { bar: 'bg-[#DC2626]', label: 'text-[#B91C1C]' }
};

const INTRO = {
  [NOT_SUBMITTED]: `Add your company details and ${REQUIRED_DOCS} legal documents, then submit them for review. Jobs, candidates and gigs unlock once your company is approved.`,
  [PENDING]: 'We’re checking your company details and documents. They are locked until the review is done. You can still update your office photos.',
  [APPROVED]: 'Your company is verified. Company details and documents are locked. You can still update your office photos.',
  [REJECTED]: 'Your company profile needs changes. Update the details or documents below, then resubmit for review.'
};

/** The three review steps for each status, with dates from the company record. */
function buildSteps(status, submittedAt, reviewedAt) {
  const submitted = formatShortDate(submittedAt);
  const reviewed = formatShortDate(reviewedAt);
  switch (status) {
    case PENDING:
      return [
        { label: 'Submitted', detail: submitted, tone: 'done' },
        { label: 'Under review', detail: 'In progress', tone: 'current' },
        { label: 'Approved', detail: 'You’ll get an email', tone: 'todo' }
      ];
    case APPROVED:
      return [
        { label: 'Submitted', detail: submitted, tone: 'done' },
        { label: 'Under review', detail: 'Complete', tone: 'done' },
        { label: 'Approved', detail: reviewed, tone: 'done' }
      ];
    case REJECTED:
      return [
        { label: 'Submitted', detail: submitted, tone: 'done' },
        { label: 'Under review', detail: 'Complete', tone: 'done' },
        { label: 'Changes requested', detail: reviewed, tone: 'error' }
      ];
    default:
      return [
        { label: 'Submitted', detail: 'Not submitted yet', tone: 'todo' },
        { label: 'Under review', detail: 'Starts when you submit', tone: 'todo' },
        { label: 'Approved', detail: 'You’ll get an email', tone: 'todo' }
      ];
  }
}

export default function VerificationCard({ status, company }) {
  const steps = buildSteps(status, company?.verificationSubmittedAt, company?.verificationReviewedAt);
  const currentIndex = steps.findIndex((step) => step.tone === 'current' || step.tone === 'error');

  return (
    <Card labelledBy="verification-title" className="gap-[18px]">
      <div className="flex max-w-[640px] flex-col gap-1">
        <h2 id="verification-title" className="m-0 text-[17px] leading-[1.45] tracking-normal text-[#0F172A]">
          <span className="font-semibold">Verification</span>
        </h2>
        <p className={`m-0 ${MUTED}`}>{INTRO[status]}</p>
      </div>

      {status === REJECTED && company?.verificationNote && (
        <div role="status" className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[#7F1D1D]">
          <span className="font-semibold">Reason from the review team: </span>
          <span className="whitespace-pre-line">{company.verificationNote}</span>
        </div>
      )}

      <ol aria-label="Verification progress" className="m-0 grid list-none grid-cols-3 gap-1.5 p-0">
        {steps.map((step, index) => (
          <li key={step.label} aria-current={index === currentIndex ? 'step' : undefined} className="flex min-w-0 flex-col gap-1.5">
            <div className={`h-1.5 rounded-[3px] ${TONES[step.tone].bar}`} />
            <span className={`font-semibold ${TONES[step.tone].label}`}>{step.label}</span>
            {step.detail && <span className={`text-xs ${MUTED}`}>{step.detail}</span>}
          </li>
        ))}
      </ol>
    </Card>
  );
}
