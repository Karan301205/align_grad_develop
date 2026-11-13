// Mirrors backend src/modules/recruiters/companyProfile.js; keep the two in sync.
export const VERIFICATION_DOC_TYPES = [
  'Certificate of Incorporation',
  'CIN',
  'PAN Card',
  'GST Registration Certificate',
  'Company Registration Certificate if separate',
  'Registered Office Address Proof'
];
export const REQUIRED_DOCS = 2;
export const MAX_OFFICE_PHOTOS = 10;
export const DESCRIPTION_MAX = 1000;

// Stored values keep the hyphen used by existing rows; labels use an en dash.
export const COMPANY_SIZES = [
  ['1-10 employees', '1–10 employees'],
  ['11-50 employees', '11–50 employees'],
  ['51-200 employees', '51–200 employees'],
  ['201-500 employees', '201–500 employees'],
  ['501-1000 employees', '501–1,000 employees'],
  ['1000+ employees', '1,000+ employees']
];
export const companySizeLabel = (value) => COMPANY_SIZES.find(([stored]) => stored === value)?.[1] || value;

export const MB = 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const LOGO_MAX_BYTES = 2 * MB; // server cap for fileType "image"
export const PHOTO_MAX_BYTES = 10 * MB; // server cap for fileType "doc"
export const DOC_MAX_BYTES = 10 * MB;

const filled = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Profile checklist (right-hand card). The first four items are what review needs
 * (backend REQUIRED_PROFILE_FIELDS + 2 documents); LinkedIn and photos are optional.
 */
export function buildChecklist(values, docs, photos) {
  return [
    { id: 'basics', label: 'Company basics', done: ['name', 'industry', 'companySize', 'location', 'website'].every((key) => filled(values[key])) },
    { id: 'about', label: 'About your company', done: filled(values.description) },
    { id: 'recruiter', label: 'Recruiter details', done: ['recruiterName', 'recruiterDesignation', 'officialEmail'].every((key) => filled(values[key])) },
    { id: 'documents', label: 'Verification documents', done: docs.length === REQUIRED_DOCS },
    { id: 'linkedin', label: 'LinkedIn page', done: filled(values.linkedin) },
    { id: 'photos', label: 'Office photos', done: photos.length > 0 }
  ];
}
