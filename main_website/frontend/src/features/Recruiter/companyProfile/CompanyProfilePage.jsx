import { COMPANY_VERIFICATION_STATUS, getCompanyVerificationStatus } from '../../../utils/companyVerification';
import { ACCOUNT_PAGE, CARD, MUTED, PAGE_TITLE, SECONDARY_BUTTON } from '../components/accountStyles';
import { buildChecklist } from './constants';
import useCompanyProfile from './useCompanyProfile';
import VerificationCard from './components/VerificationCard';
import CompanyCard from './components/CompanyCard';
import RecruiterCard from './components/RecruiterCard';
import DocumentsCard from './components/DocumentsCard';
import ShowcaseCard from './components/ShowcaseCard';
import ChecklistCard from './components/ChecklistCard';

const FORM_ID = 'company-profile-form';
const { PENDING, APPROVED, REJECTED } = COMPANY_VERIFICATION_STATUS;

function LoadError({ message, onRetry }) {
  return (
    <div role="alert" className={`${CARD} flex flex-col items-start gap-3 px-6 py-[22px]`}>
      <span className="font-semibold text-[#B91C1C]">We couldn’t load your company profile.</span>
      <span className={MUTED}>{message}</span>
      <button type="button" onClick={onRetry} className={`${SECONDARY_BUTTON} h-10 px-3.5`}>
        Try again
      </button>
    </div>
  );
}

/**
 * Recruiter company profile (design: design/Company profile & verification-html).
 * Editable until submitted, read-only while an admin reviews it and after approval,
 * editable again if rejected. Office photos stay editable in every state.
 */
export default function CompanyProfilePage({ company, loadError, onRetry, token, handleUpdateCompany, handleVerification, setAlertConfig }) {
  const status = getCompanyVerificationStatus(company);
  const locked = status === PENDING || status === APPROVED;
  const lockedLabel = status === PENDING ? 'Locked during review' : 'Locked after approval';
  const notify = (message, type = 'info') => setAlertConfig({ message, type });
  const form = useCompanyProfile({ company, status, token, locked, notify, handleUpdateCompany, handleVerification });

  return (
    <div className={ACCOUNT_PAGE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-[22px]">
        <header className="flex flex-col gap-1">
          <h1 className={PAGE_TITLE}>
            <span className="font-bold">Company profile</span>
          </h1>
          <p className={`m-0 text-[15px] ${MUTED}`}>Candidates see this page before they apply to your jobs.</p>
        </header>

        {!company ? (
          <LoadError message={loadError || 'The server did not return your company details.'} onRetry={onRetry} />
        ) : (
          <>
            <VerificationCard status={status} company={company} />

            <div className="flex flex-wrap items-start gap-5">
              <form id={FORM_ID} onSubmit={form.submit} noValidate className="flex min-w-0 grow-[999] basis-[560px] flex-col gap-5">
                <CompanyCard
                  locked={locked}
                  lockedLabel={lockedLabel}
                  values={form.values}
                  setField={form.setField}
                  errors={form.errors}
                  logoUrl={form.logoUrl}
                  uploadingLogo={form.busy.logo}
                  onLogoUpload={form.uploadLogo}
                />
                <RecruiterCard values={form.values} setField={form.setField} errors={form.errors} locked={locked} lockedLabel={lockedLabel} />
                <DocumentsCard
                  docs={form.docs}
                  locked={locked}
                  lockedLabel={lockedLabel}
                  submittedAt={company.verificationSubmittedAt}
                  docType={form.docType}
                  setDocType={form.setDocType}
                  uploading={form.busy.doc}
                  onUpload={form.uploadDoc}
                  onRemove={form.removeDoc}
                  error={form.errors.verification}
                />
                <ShowcaseCard
                  locked={locked}
                  linkedin={form.values.linkedin}
                  onLinkedinChange={(value) => form.setField('linkedin', value)}
                  linkedinError={form.errors.linkedin}
                  photos={form.photos}
                  uploading={form.busy.photos}
                  removingUrl={form.busy.removingPhoto}
                  onUpload={form.uploadPhotos}
                  onRemove={form.removePhoto}
                />
              </form>

              <ChecklistCard
                items={buildChecklist(form.values, form.docs, form.photos)}
                formId={FORM_ID}
                editable={!locked}
                submitting={form.busy.submit}
                resubmit={status === REJECTED}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
