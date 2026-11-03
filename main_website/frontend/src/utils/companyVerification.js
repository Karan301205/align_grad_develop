// Company verification lifecycle (mirrors backend modules/recruiters/companyVerification.js).
// Recruiters submit their company profile + documents (PENDING); an AlignGrad
// administrator approves or rejects it. Only APPROVED recruiters get full portal access.
export const COMPANY_VERIFICATION_STATUS = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export function getCompanyVerificationStatus(company) {
  if (!company) return COMPANY_VERIFICATION_STATUS.NOT_SUBMITTED;
  if (company.verificationStatus && COMPANY_VERIFICATION_STATUS[company.verificationStatus]) {
    return company.verificationStatus;
  }
  if (company.verified) return COMPANY_VERIFICATION_STATUS.APPROVED;
  const hasDocs = (Array.isArray(company.verificationDocs) && company.verificationDocs.length > 0) || Boolean(company.docUrl);
  return hasDocs ? COMPANY_VERIFICATION_STATUS.PENDING : COMPANY_VERIFICATION_STATUS.NOT_SUBMITTED;
}

// Message shown when a recruiter tries to open a section that requires approval.
export function getPortalLockedMessage(status) {
  switch (status) {
    case COMPANY_VERIFICATION_STATUS.PENDING:
      return 'Your company profile is under admin review. You will get an email once it is approved.';
    case COMPANY_VERIFICATION_STATUS.REJECTED:
      return 'Your company profile was not approved. Please update it and resubmit for review.';
    default:
      return 'Please complete your company profile and submit it for admin review.';
  }
}
