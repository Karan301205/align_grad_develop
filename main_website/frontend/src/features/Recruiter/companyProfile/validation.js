import { REQUIRED_DOCS } from './constants';

// Same rules the previous company profile page enforced.
const URL_PATTERN = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
const GMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

// Character filters applied while typing.
export const keepLetters = (value) => value.replace(/[^a-zA-Z\s]/g, '');
export const keepDigits = (value, max) => value.replace(/[^0-9]/g, '').slice(0, max);
export const keepUrlChars = (value) => value.replace(/[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/g, '');
export const keepEmailChars = (value) => {
  const cleaned = value.replace(/[^a-zA-Z0-9._%+@-]/g, '');
  const at = cleaned.indexOf('@');
  return at === -1 ? cleaned : cleaned.slice(0, at + 1) + cleaned.slice(at + 1).replace(/@/g, '');
};

export const isValidUrl = (value) => URL_PATTERN.test((value || '').trim());
export const withProtocol = (value) => {
  const trimmed = (value || '').trim();
  return trimmed && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
};

const blank = (value) => !value || !value.trim();

/**
 * Field errors keyed by field id, in on-screen order (the first one gets focus).
 * @returns {Record<string, string>}
 */
export function validateProfile(values, docs) {
  const errors = {};
  if (blank(values.name)) errors.name = 'Company name is required.';
  if (blank(values.industry)) errors.industry = 'Industry is required.';
  if (blank(values.companySize)) errors.companySize = 'Company size is required.';
  if (blank(values.location)) errors.location = 'Headquarters location is required.';
  if (values.foundedYear && (values.foundedYear.length !== 4 || Number(values.foundedYear) > new Date().getFullYear())) {
    errors.foundedYear = 'Enter a valid four-digit year.';
  }
  if (blank(values.website)) errors.website = 'Official website URL is required.';
  else if (!isValidUrl(values.website)) errors.website = 'Enter a valid website link, for example https://company.com.';
  if (blank(values.description)) errors.description = 'Company description is required.';
  if (blank(values.recruiterName)) errors.recruiterName = 'Recruiter name is required.';
  if (blank(values.recruiterDesignation)) errors.recruiterDesignation = 'Recruiter designation is required.';
  if (blank(values.officialEmail)) errors.officialEmail = 'Official email address is required.';
  else if (!GMAIL_PATTERN.test(values.officialEmail.trim())) errors.officialEmail = 'Use a Gmail address (ending in @gmail.com).';
  if (docs.length !== REQUIRED_DOCS) errors.verification = `Upload ${REQUIRED_DOCS} different legal documents to verify your company.`;
  if (values.linkedin && !isValidUrl(values.linkedin)) errors.linkedin = 'Enter a valid LinkedIn link, for example https://linkedin.com/company/name.';
  return errors;
}
