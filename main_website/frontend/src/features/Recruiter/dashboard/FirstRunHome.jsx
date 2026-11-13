import { Building2, Check, Clock, CreditCard, Lock } from 'lucide-react';
import { COMPANY_VERIFICATION_STATUS, getCompanyVerificationStatus } from '../../../utils/companyVerification';
import { formatShortDate } from '../../../utils/format';
import { SUPPORT_EMAIL } from '../../RecruiterLanding/content';
import { ACCOUNT_PAGE, CARD, LINK, MUTED, PAGE_TITLE, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../components/accountStyles';
import { REQUIRED_DOCS } from '../companyProfile/constants';

const { PENDING, REJECTED } = COMPANY_VERIFICATION_STATUS;

// Fields the server requires before a profile can be submitted (recruiters/companyProfile.js).
const DETAIL_FIELDS = ['name', 'industry', 'companySize', 'location', 'website', 'description', 'recruiterName', 'recruiterDesignation', 'officialEmail'];
const filled = (value) => typeof value === 'string' && value.trim().length > 0;

const STEP_STYLE = {
  done: { tile: 'bg-[#F5F7FB]', mark: 'bg-[#1447E6] text-white', detail: MUTED },
  current: { tile: 'border border-[#FCD34D] bg-[#FFFBEB]', mark: 'border-2 border-[#D97706] bg-white text-[#B45309]', detail: 'text-[#92400E]' },
  error: { tile: 'border border-[#FECACA] bg-[#FEF2F2]', mark: 'border-2 border-[#DC2626] bg-white text-[#B91C1C]', detail: 'text-[#B91C1C]' },
  todo: { tile: 'border border-[#E4E6EA] bg-white', mark: 'border-2 border-[#9CA3AF] text-[#4B5563]', detail: MUTED }
};

function documentsOf(company) {
  if (Array.isArray(company?.verificationDocs) && company.verificationDocs.length > 0) return company.verificationDocs;
  return company?.docUrl ? [{ docType: 'Certificate of Incorporation' }] : [];
}

/** The 4 setup steps for the company's current review status. */
function buildSteps(company, status) {
  const detailsDone = DETAIL_FIELDS.every((key) => filled(company?.[key]));
  const docs = documentsOf(company);
  const docsDone = docs.length >= REQUIRED_DOCS;
  const review =
    status === PENDING
      ? { state: 'current', detail: 'Our team is checking your details and documents. We’ll email you when it’s done.' }
      : status === REJECTED
        ? { state: 'error', detail: 'Changes requested. Update your profile and resubmit.' }
        : { state: 'todo', detail: 'Starts when you submit your profile.' };
  return [
    { title: 'Create your account', state: 'done', detail: 'Done' },
    {
      title: 'Add company details',
      state: detailsDone ? 'done' : 'todo',
      detail: detailsDone ? [company.name, company.location].filter(Boolean).join(' · ') : 'Company, about and recruiter details'
    },
    {
      title: 'Upload verification documents',
      state: docsDone ? 'done' : 'todo',
      detail: docsDone ? docs.map((doc) => doc.docType).join(' · ') : `${docs.length} of ${REQUIRED_DOCS} added`
    },
    { title: 'AlignGrad review', ...review }
  ];
}

function StatusPill({ status, submittedAt }) {
  const since = formatShortDate(submittedAt);
  const pill =
    status === PENDING
      ? ['bg-[#FEF3C7] text-[#92400E]', since ? `Under review since ${since}` : 'Under review']
      : status === REJECTED
        ? ['bg-[#FEE2E2] text-[#991B1B]', 'Changes requested']
        : ['bg-[#F1F3F6] text-[#334155]', 'Not submitted yet'];
  return (
    <span className={`inline-flex h-[30px] items-center gap-2 rounded-full px-3 text-[13px] font-semibold ${pill[0]}`}>
      <Clock className="size-3.5" aria-hidden="true" />
      {pill[1]}
    </span>
  );
}

function WaitCard({ icon: Icon, title, children, action }) {
  return (
    <div className={`${CARD} flex min-w-0 flex-col gap-3.5 p-[22px]`}>
      {Icon && (
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-[10px] bg-[#EEF2FE] text-[#1447E6]">
          <Icon className="size-5" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-base leading-[1.45] tracking-normal text-[#0F172A]">
          <span className="font-semibold">{title}</span>
        </h3>
        {children}
      </div>
      {action && <div className="mt-auto">{action}</div>}
    </div>
  );
}

/** A labelled bar with a tick at the minimum (no candidate data; it only explains the colours). */
function ExampleBar({ label, fill, tone }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px]">
      <span className="w-[104px] shrink-0 font-semibold">{label}</span>
      <div aria-hidden="true" className="relative h-2 flex-1 rounded-[4px] bg-[#E4E6EA]">
        <div className={`absolute inset-y-0 left-0 rounded-[4px] ${tone}`} style={{ width: fill }} />
        <div className="absolute -inset-y-1 left-[70%] w-0.5 bg-[#0F172A]" />
      </div>
    </div>
  );
}

const UNLOCKS = [
  ['Publish jobs and internships', 'Post jobs with skill bars and screening questions'],
  ['Search candidates', 'Filter by skill level, college and graduation year'],
  ['Post paid gigs', 'Short paid tasks for candidates on AlignGrad']
];

/**
 * Home for a recruiter whose company isn't approved yet (design: design/First run —
 * account under review-html). Built from the company record only; after approval
 * the Home tab shows the normal dashboard again.
 */
export default function FirstRunHome({ company, user, goToTab }) {
  const status = getCompanyVerificationStatus(company);
  const steps = buildSteps(company, status);
  const doneCount = steps.filter((step) => step.state === 'done').length;
  const name = company?.recruiterName || user?.name || '';
  const quota = company?.jobQuota;
  const photos = Array.isArray(company?.photos) ? company.photos.length : 0;

  const intro =
    status === PENDING
      ? 'You’re one step from hiring. Our team is checking your company documents, and we’ll email you when it’s done.'
      : status === REJECTED
        ? 'Our team asked for changes to your company profile. Update it and resubmit for review.'
        : 'You’re a few steps from hiring. Complete your company profile and submit it for review.';

  const profileCard =
    status === PENDING ? (
      <WaitCard
        icon={Building2}
        title="Finish your company page"
        action={
          <button type="button" onClick={() => goToTab('verification')} className={`${SECONDARY_BUTTON} h-11 px-[18px]`}>
            {photos ? 'Manage photos' : 'Add photos'}
          </button>
        }
      >
        <p className={`m-0 ${MUTED}`}>
          {photos ? `You have ${photos} office photo${photos === 1 ? '' : 's'}. ` : 'Add office photos. '}
          Candidates see your company page before they apply, and photos can be changed even during review.
        </p>
      </WaitCard>
    ) : (
      <WaitCard
        icon={Building2}
        title={status === REJECTED ? 'Update your company profile' : 'Complete your company profile'}
        action={
          <button type="button" onClick={() => goToTab('verification')} className={`${PRIMARY_BUTTON} h-11 px-[18px]`}>
            {status === REJECTED ? 'Update profile' : 'Go to company profile'}
          </button>
        }
      >
        <p className={`m-0 ${MUTED}`}>
          {status === REJECTED
            ? 'Fix what the review team asked for, then resubmit.'
            : `Add company and recruiter details and ${REQUIRED_DOCS} legal documents, then submit them for review.`}
        </p>
      </WaitCard>
    );

  return (
    <div className={ACCOUNT_PAGE}>
      <div className="mx-auto flex max-w-[1040px] flex-col gap-7 sm:pt-2">
        <header className="flex flex-col gap-1.5">
          <h1 className={PAGE_TITLE}>
            <span className="font-bold">Welcome to AlignGrad{name ? `, ${name}` : ''}</span>
          </h1>
          <p className={`m-0 max-w-[640px] text-[15px] ${MUTED}`}>{intro}</p>
        </header>

        <section aria-labelledby="setup-title" className={`${CARD} flex flex-col gap-[22px] p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 id="setup-title" className="m-0 text-[17px] leading-[1.45] tracking-normal text-[#0F172A]">
                <span className="font-semibold">Account setup</span>
              </h2>
              <span className={MUTED}>
                {doneCount} of {steps.length} steps done
              </span>
            </div>
            <StatusPill status={status} submittedAt={company?.verificationSubmittedAt} />
          </div>
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3 p-0">
            {steps.map((step, index) => {
              const style = STEP_STYLE[step.state];
              return (
                <li key={step.title} aria-current={step.state === 'current' ? 'step' : undefined} className={`flex flex-col gap-2 rounded-[10px] p-4 ${style.tile}`}>
                  <span aria-hidden="true" className={`flex size-7 items-center justify-center rounded-full text-[13px] font-bold ${style.mark}`}>
                    {step.state === 'done' ? <Check className="size-4" strokeWidth={2.5} /> : index + 1}
                  </span>
                  <span className="font-semibold">{step.title}</span>
                  <span className={`break-words text-[13px] ${style.detail}`}>{step.detail}</span>
                  <span className="sr-only">{step.state === 'done' ? '(done)' : step.state === 'current' ? '(in progress)' : ''}</span>
                </li>
              );
            })}
          </ol>
          {status === REJECTED && company?.verificationNote && (
            <div role="status" className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[#7F1D1D]">
              <span className="font-semibold">Reason from the review team: </span>
              <span className="whitespace-pre-line">{company.verificationNote}</span>
            </div>
          )}
        </section>

        <section aria-labelledby="wait-title" className="flex flex-col gap-3.5">
          <h2 id="wait-title" className="m-0 text-[17px] leading-[1.45] tracking-normal text-[#0F172A]">
            <span className="font-semibold">{status === PENDING ? 'While you wait' : 'Next steps'}</span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
            {profileCard}

            <WaitCard title="How skill bars work">
              <p className={`m-0 ${MUTED}`}>
                When you post a job, you set a minimum score out of 10 for each skill. Candidates below a bar that has a skill test can’t apply until they reach it.
              </p>
              <div className="mt-2.5 flex flex-col gap-2.5 rounded-[10px] bg-[#F8F8F6] p-3.5">
                <ExampleBar label="Meets the bar" fill="80%" tone="bg-[#1447E6]" />
                <ExampleBar label="Below the bar" fill="50%" tone="bg-[#C2410C]" />
                <span className={`text-xs ${MUTED}`}>Black line = your bar. Blue = meets it. Orange = below it.</span>
              </div>
            </WaitCard>

            <WaitCard
              icon={CreditCard}
              title="Job credits"
              action={
                <button type="button" onClick={() => goToTab('billing')} className={`${SECONDARY_BUTTON} h-11 px-[18px]`}>
                  Plan &amp; billing
                </button>
              }
            >
              <p className={`m-0 ${MUTED}`}>
                {quota
                  ? `You have ${quota.remaining} job credit${quota.remaining === 1 ? '' : 's'}. Each job you publish after approval uses one, and you can buy more any time.`
                  : 'Each job you publish after approval uses one job credit. You can see and buy credits on Plan & billing.'}
              </p>
            </WaitCard>
          </div>
        </section>

        <section aria-labelledby="unlock-title" className={`${CARD} flex flex-col gap-3.5 px-5 py-[22px] sm:px-6`}>
          <h2 id="unlock-title" className="m-0 text-[17px] leading-[1.45] tracking-normal text-[#0F172A]">
            <span className="font-semibold">Unlocks after approval</span>
          </h2>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3 p-0">
            {UNLOCKS.map(([title, detail]) => (
              <li key={title} className="flex items-start gap-3">
                <Lock className="mt-0.5 size-[18px] shrink-0 text-[#6B7280]" aria-hidden="true" />
                <span>
                  <strong className="font-semibold">{title}</strong>
                  <br />
                  <span className={MUTED}>{detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className={`m-0 mt-1 ${MUTED}`}>
            Questions about verification?{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK}>
              Contact support
            </a>
          </p>
        </section>
      </div>

    </div>
  );
}
