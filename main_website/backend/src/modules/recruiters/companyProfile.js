// Company profile rules shared by the recruiter company endpoints.
// Pure functions only (no database / S3 access) so they can be unit tested.
// The frontend mirrors these lists in
// frontend/src/features/Recruiter/companyProfile/constants.js — keep them in sync.

const VERIFICATION_DOC_TYPES = [
  'Certificate of Incorporation',
  'CIN',
  'PAN Card',
  'GST Registration Certificate',
  'Company Registration Certificate if separate',
  'Registered Office Address Proof'
];

const REQUIRED_VERIFICATION_DOCS = 2;
const MAX_OFFICE_PHOTOS = 10;

// Profile fields that must be filled before a company can be queued for admin review.
const REQUIRED_PROFILE_FIELDS = [
  ['name', 'Company name'],
  ['industry', 'Industry'],
  ['companySize', 'Company size'],
  ['location', 'Headquarters location'],
  ['website', 'Official website URL'],
  ['description', 'Company description'],
  ['recruiterName', 'Recruiter name'],
  ['recruiterDesignation', 'Recruiter designation'],
  ['officialEmail', 'Official email address']
];

const isFilled = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Lists everything that stops a company from being submitted for verification.
 * @param {object} company - the saved Company row
 * @param {Array<{docType: string, docUrl: string}>} docs - documents in the submission
 * @returns {string[]} human-readable problems; empty when the submission is complete
 */
function getSubmissionProblems(company, docs) {
  const problems = [];
  const missing = REQUIRED_PROFILE_FIELDS.filter(([key]) => !isFilled(company?.[key])).map(([, label]) => label);
  if (missing.length > 0) {
    problems.push(`Complete these fields before submitting: ${missing.join(', ')}.`);
  }

  const list = Array.isArray(docs) ? docs : [];
  if (list.length !== REQUIRED_VERIFICATION_DOCS) {
    problems.push(`Upload exactly ${REQUIRED_VERIFICATION_DOCS} legal documents (${list.length} provided).`);
  }
  const types = list.map((doc) => doc?.docType);
  if (types.some((type) => !VERIFICATION_DOC_TYPES.includes(type))) {
    problems.push('One of the documents has an unsupported document type.');
  }
  if (new Set(types).size !== types.length) {
    problems.push('Each document must be a different document type.');
  }
  return problems;
}

/**
 * Job posting quota as shown in the recruiter header ("0 / 1 used").
 * `used` counts job/internship posts (gigs excluded), the same way postJob enforces the limit.
 */
function buildJobQuota(quota, used) {
  const total = Number.isInteger(quota) && quota > 0 ? quota : 1;
  const usedCount = Number.isInteger(used) && used > 0 ? used : 0;
  return { total, used: usedCount, remaining: Math.max(0, total - usedCount) };
}

/** True when `url` points inside one of the caller's own upload folders. */
function isOwnUpload(url, ownPrefixes) {
  return typeof url === 'string' && ownPrefixes.some((prefix) => url.startsWith(prefix));
}

module.exports = {
  VERIFICATION_DOC_TYPES,
  REQUIRED_VERIFICATION_DOCS,
  MAX_OFFICE_PHOTOS,
  REQUIRED_PROFILE_FIELDS,
  getSubmissionProblems,
  buildJobQuota,
  isOwnUpload
};
