// Field rules for the candidate profile (design: candidate_profile_design).
// Every input runs its value through a `clean*` function on change, so characters
// that don't belong in the field can't be typed or pasted, and through an `*Error`
// function on save, which returns '' when the value is fine or a plain sentence.
import { hasSkillMcq } from '../../../constants';
import { DATE_MAX, DATE_MIN, DOB_MIN, isDateInRange, toDateInputValue, todayInputValue } from '../../../utils/dateInput';

export const LIMITS = {
  name: 50,
  bio: 300,
  bioMin: 20,
  email: 254,
  url: 300,
  title: 100,
  role: 80,
  institute: 120,
  degree: 80,
  field: 80,
  company: 100,
  domain: 60,
  location: 80,
  description: 1500,
  activity: 100,
  activityLine: 300,
  certId: 30,
  skill: 50,
  projectSkills: 20,
  cities: 15,
  stream: 40
};

/* ------------------------------------------------------------------ options */

// Values are what the API stores (recruiter filters and job matching read them);
// labels are what the candidate sees.
export const WORK_TYPES = [
  { value: 'Full-Time', label: 'Full-time job' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Part-Time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' }
];

export const WORK_MODES = [
  { value: 'On-Site', label: 'Office' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Remote', label: 'Remote' }
];

export const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

// `length`: exact number of digits for a mobile number; others accept 7 to 15 digits.
export const COUNTRY_CODES = [
  { code: '+91', label: '+91 India', length: 10, first: /^[6-9]/ },
  { code: '+1', label: '+1 US / Canada', length: 10 },
  { code: '+44', label: '+44 UK', length: 10 },
  { code: '+61', label: '+61 Australia', length: 9 },
  { code: '+65', label: '+65 Singapore', length: 8 },
  { code: '+971', label: '+971 UAE' },
  { code: '+82', label: '+82 South Korea' },
  { code: '+81', label: '+81 Japan' }
];

// eduType values are the stored ones; each level can be added once.
export const EDU_LEVELS = [
  { value: 'Bachelors', label: 'Degree', place: 'College or university', placeholder: 'e.g. CVR College of Engineering' },
  { value: 'Masters', label: 'Postgraduate', place: 'College or university', placeholder: 'e.g. University of Hyderabad' },
  { value: 'Doctorate', label: 'Doctorate', place: 'University', placeholder: 'e.g. IIT Madras' },
  { value: 'Diploma', label: 'Diploma', place: 'Polytechnic or institute', placeholder: 'e.g. Government Polytechnic' },
  { value: 'High School', label: 'Class 10 & 12', place: 'Junior college or school', placeholder: 'e.g. Sri Chaitanya Junior College' }
];

export const DEGREE_SUGGESTIONS = {
  Bachelors: ['B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'BBA', 'BCA', 'B.A.', 'B.Des', 'B.Arch', 'B.Pharm'],
  Masters: ['M.Tech', 'M.E.', 'M.Sc', 'M.Com', 'MBA', 'MCA', 'M.A.', 'M.Des'],
  Doctorate: ['Ph.D'],
  Diploma: ['Diploma', 'Polytechnic diploma', 'PG Diploma']
};

export const GRADE_TYPES = [
  { value: 'CGPA', label: 'CGPA (out of 10)', max: 10, placeholder: 'e.g. 8.4' },
  { value: 'GPA', label: 'GPA (out of 10)', max: 10, placeholder: 'e.g. 8.2' },
  { value: 'Percentage', label: 'Percentage', max: 100, placeholder: 'e.g. 82.5' },
  { value: 'Grade', label: 'Letter grade', placeholder: 'e.g. A+' }
];

export const STREAMS = ['MPC', 'BiPC', 'MEC', 'CEC', 'HEC', 'Science', 'Commerce', 'Arts'];

export const EXPERIENCE_TYPES = [
  { value: 'Internship', label: 'Internship' },
  { value: 'Part-Time', label: 'Part-time' },
  { value: 'Full-Time', label: 'Full-time' },
  { value: 'Freelance', label: 'Freelance' }
];

const label = (list, value) => list.find((item) => item.value === value)?.label || value || '';
export const workTypeLabel = (value) => label(WORK_TYPES, value);
export const workModeLabel = (value) => label(WORK_MODES, value);
export const eduLevelLabel = (value) => label(EDU_LEVELS, value);
export const experienceTypeLabel = (value) => (value === 'Gig' ? 'Gig' : label(EXPERIENCE_TYPES, value));

/* ------------------------------------------------------------- sanitizers */

// Invisible control characters (not tab or line breaks), which never belong in profile text.
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const collapse = (value) => value.replace(/[ \t]{2,}/g, ' ').replace(/^\s+/, '');

/** Letters (any script), spaces, apostrophes, dots and hyphens: names. */
export const cleanName = (value) => collapse(String(value).replace(/[^\p{L}\p{M}\s'.-]/gu, '').replace(/\s/g, ' '));

/** Lower-case letters, digits and underscores: usernames. */
export const cleanUsername = (value) => String(value).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15);

/** Digits only. */
export const cleanDigits = (value) => String(value).replace(/\D/g, '');

/** Letters and spaces only. */
export const cleanLetters = (value) => collapse(String(value).replace(/[^\p{L}\p{M}\s]/gu, '').replace(/\s/g, ' '));

/** Names of places and courses: letters, spaces and & . , ' ( ) / - (digits only when allowed). */
export const cleanPlace = (value, { digits = false } = {}) =>
  collapse(String(value).replace(digits ? /[^\p{L}\p{M}\p{N}\s&.,'()/-]/gu : /[^\p{L}\p{M}\s&.,'()/-]/gu, '').replace(/\s/g, ' '));

/** Roles and company names: letters, digits, spaces and & . , ' ( ) / + # @ ! : - */
export const cleanRole = (value) => collapse(String(value).replace(/[^\p{L}\p{M}\p{N}\s&.,'()/+#@!:-]/gu, '').replace(/\s/g, ' '));

/** Skill names: letters, digits, spaces and + # . / & - (C++, C#, Node.js, R&D). */
export const cleanSkill = (value) => collapse(String(value).replace(/[^\p{L}\p{M}\p{N}\s+#./&-]/gu, '').replace(/\s/g, ' ')).slice(0, LIMITS.skill);

/** Free text on one line: anything printable. */
export const cleanLine = (value) => collapse(String(value).replace(CONTROL, '').replace(/[\r\n\t]/g, ' '));

/** Free text over several lines: anything printable, line breaks kept. */
export const cleanMultiline = (value) => String(value).replace(CONTROL, '').replace(/^\s+/, '');

/** Links: no spaces. */
export const cleanUrl = (value) => String(value).replace(/\s/g, '');

/**
 * A number typed into a score field. Returns the cleaned text, or null to refuse
 * the keystroke (too many decimals, above `max`, a second dot).
 */
export function cleanDecimal(value, { max, decimals = 2 }) {
  const text = String(value).replace(/[^0-9.]/g, '');
  if (text === '') return '';
  if ((text.match(/\./g) || []).length > 1) return null;
  const [whole, fraction = ''] = text.split('.');
  if (fraction.length > decimals) return null;
  if (whole.length > 3) return null;
  const number = Number(text.endsWith('.') ? whole : text);
  if (Number.isFinite(number) && number > max) return null;
  return text.startsWith('.') ? `0${text}` : text;
}

/** A letter grade such as A, B+ or O. */
export const cleanLetterGrade = (value) => {
  const text = String(value).toUpperCase().replace(/[^A-Z+-]/g, '');
  const match = /^[A-Z][+-]?/.exec(text);
  return match ? match[0] : '';
};

/* ------------------------------------------------------------- validators */
// Messages stay short: "Enter your …" when empty, "Enter a valid …" when wrong.

const hasLetter = (value) => /\p{L}/u.test(value);

export function nameError(value, fieldLabel) {
  const text = String(value || '').trim();
  if (!text) return `Enter your ${fieldLabel}.`;
  if (!hasLetter(text) || /['.-]{2,}/.test(text) || text.length > LIMITS.name) return `Enter a valid ${fieldLabel}.`;
  return '';
}

export function usernameError(value, status) {
  const text = String(value || '');
  if (!text) return 'Choose a username.';
  if (!/^[a-z0-9_]{3,15}$/.test(text) || !/[a-z]/.test(text)) return 'Enter a valid username.';
  if (status === 'taken') return 'This username is taken.';
  if (status === 'checking') return 'Checking this username. Try again.';
  return '';
}

/**
 * `field` reads after "Enter …" (e.g. 'the project name'); `name` reads after
 * "Enter a valid …" and defaults to `field` without its article.
 */
export function textError(value, { field, name, required = false, min = 0, max, needLetter = true }) {
  const text = String(value || '').trim();
  if (!text) return required ? `Enter ${field}.` : '';
  if (min && text.length < min) return `Write at least ${min} characters.`;
  if ((needLetter && !hasLetter(text)) || (max && text.length > max)) return `Enter a valid ${name || field.replace(/^(the|your|a|an) /, '')}.`;
  return '';
}

export function bioError(value) {
  return textError(value, { field: 'a short intro', required: true, min: LIMITS.bioMin, max: LIMITS.bio });
}

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
export function emailError(value) {
  const text = String(value || '').trim();
  if (!text) return 'Enter your email.';
  if (text.length > LIMITS.email || !EMAIL.test(text) || /\.\./.test(text)) return 'Enter a valid email.';
  return '';
}

export function phoneError(code, digits) {
  const number = String(digits || '');
  if (!number) return 'Enter your phone number.';
  const country = COUNTRY_CODES.find((item) => item.code === code);
  const badLength = country?.length ? number.length !== country.length : number.length < 7 || number.length > 15;
  if (badLength || (country?.first && !country.first.test(number)) || /^(\d)\1+$/.test(number)) return 'Enter a valid phone number.';
  return '';
}

/** "+91 9876543210" → { code: '+91', digits: '9876543210' } (also reads "+919876543210"). */
export function splitPhone(phone) {
  const text = String(phone || '').trim();
  if (!text) return { code: '+91', digits: '' };
  const spaced = /^(\+\d{1,4})\s+(.*)$/.exec(text);
  if (spaced) return { code: spaced[1], digits: cleanDigits(spaced[2]) };
  if (text.startsWith('+')) {
    const known = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length).find((item) => text.startsWith(item.code));
    if (known) return { code: known.code, digits: cleanDigits(text.slice(known.code.length)) };
  }
  return { code: '+91', digits: cleanDigits(text) };
}

export const joinPhone = (code, digits) => (digits ? `${code} ${digits}` : '');

export function ageOn(dob, today = new Date()) {
  const birth = new Date(`${toDateInputValue(dob)}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function dobError(value) {
  const date = toDateInputValue(value);
  if (!date) return 'Enter your date of birth.';
  if (!isDateInRange(date, DOB_MIN, todayInputValue())) return 'Enter a valid date of birth.';
  if (ageOn(date) < 17) return 'You must be at least 17.';
  return '';
}

const BLOCKED_SCHEMES = /^(javascript|data|vbscript|file|mailto|tel|ftp):/i;

/** Adds https:// to a link typed without one. */
export function normalizeUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

/**
 * '' for an empty or valid web link. `host` limits it to one site
 * (e.g. 'linkedin.com' also accepts in.linkedin.com).
 */
export function urlError(value, { field = 'link', host, hosts } = {}) {
  const text = String(value || '').trim();
  if (!text) return '';
  const invalid = `Enter a valid ${field}.`;
  if (/\s/.test(text) || text.length > LIMITS.url) return invalid;
  if (BLOCKED_SCHEMES.test(text) || (/^[a-z][a-z0-9+.-]*:\/\//i.test(text) && !/^https?:\/\//i.test(text))) return invalid;
  let url;
  try {
    url = new URL(normalizeUrl(text));
  } catch {
    return invalid;
  }
  const hostname = url.hostname.toLowerCase();
  const parts = hostname.split('.');
  if (parts.length < 2 || parts.some((part) => !part) || !/^[a-z]{2,}$/.test(parts[parts.length - 1])) return invalid;
  const allowed = hosts || (host ? [host] : null);
  if (allowed && !allowed.some((item) => hostname === item || hostname.endsWith(`.${item}`))) return invalid;
  return '';
}

export const DRIVE_HOSTS = ['drive.google.com', 'docs.google.com'];

/** '' when the date is empty and optional, or a real date inside the bounds. */
export function dateError(value, { field, required = false, min = DATE_MIN, max = DATE_MAX, notFuture = false }) {
  const date = toDateInputValue(value);
  if (!date) return required ? `Enter the ${field}.` : '';
  if (!isDateInRange(date, min, DATE_MAX) || date > (notFuture ? todayInputValue() : max)) return `Enter a valid ${field}.`;
  return '';
}

/** Start/end pair. `ongoing` drops the end date. Returns { start, end } messages. */
export function rangeErrors({ start, end, ongoing = false, startLabel = 'start date', endLabel = 'end date', endRequired = false, endNotFuture = false }) {
  const errors = {
    start: dateError(start, { field: startLabel, required: true, notFuture: true }),
    end: ongoing ? '' : dateError(end, { field: endLabel, required: endRequired, notFuture: endNotFuture })
  };
  if (!errors.start && !errors.end && !ongoing && end && toDateInputValue(end) < toDateInputValue(start)) {
    errors.end = `Must be after the ${startLabel}.`;
  }
  return errors;
}

export function gradeError(type, value) {
  const grade = GRADE_TYPES.find((item) => item.value === type);
  if (!grade) return 'Choose the score type.';
  const text = String(value || '').trim();
  if (!text) return 'Enter your score.';
  const name = type === 'Grade' ? 'grade' : type === 'Percentage' ? 'percentage' : type;
  if (type === 'Grade') return /^[A-Z][+-]?$/.test(text) ? '' : `Enter a valid ${name}.`;
  const number = Number(text);
  if (!/^\d+(\.\d{1,2})?$/.test(text) || number <= 0 || number > grade.max) return `Enter a valid ${name}.`;
  return '';
}

export function percentError(value, field) {
  const text = String(value || '').trim();
  if (!text) return `Enter your ${field} percentage.`;
  const number = Number(text);
  if (!/^\d+(\.\d{1,2})?$/.test(text) || number <= 0 || number > 100) return 'Enter a valid percentage.';
  return '';
}

/* --------------------------------------------------------- Class 10 & 12 */

// Class 10 & 12 is stored as one education record with the scores packed into
// `degree` and the Class 11/12 stream in `fieldOfStudy` (other screens read this shape).
export function parseHighSchool(edu = {}) {
  const degree = String(edu.degree || '');
  const field = String(edu.fieldOfStudy || '');
  return {
    class10: /Class 10:\s*([\d.]+)%/.exec(degree)?.[1] || '',
    class12: /Class 12:\s*([\d.]+)%/.exec(degree)?.[1] || '',
    stream: /Class 11 Stream:\s*(.*)$/.exec(field)?.[1]?.trim() || ''
  };
}

export const buildHighSchool = ({ class10, class12, stream }) => ({
  degree: `Class 10: ${class10}% | Class 12: ${class12}%`,
  fieldOfStudy: `Class 11 Stream: ${stream}`
});

/* ------------------------------------------------------------- formatting */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(value) {
  const match = /^(\d{4})-(\d{2})/.exec(toDateInputValue(value));
  return match ? { year: match[1], month: MONTHS[Number(match[2]) - 1] } : null;
}

/** "2025-02-14" → "Feb 2025". */
export function monthYear(value) {
  const date = parts(value);
  return date?.month ? `${date.month} ${date.year}` : '';
}

/** "2004-03-12" → "12 Mar 2004". */
export function fullDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(toDateInputValue(value));
  return match ? `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}` : '';
}

/** "Feb – Mar 2025", "Dec 2024 – Feb 2025", "Feb 2025 – Present". */
export function monthRange(start, end, ongoing) {
  const from = parts(start);
  const to = ongoing ? null : parts(end);
  if (!from && !to) return ongoing ? 'Present' : '';
  if (!from) return monthYear(end);
  if (ongoing) return `${from.month} ${from.year} – Present`;
  if (!to) return `${from.month} ${from.year}`;
  if (from.year === to.year) return from.month === to.month ? `${to.month} ${to.year}` : `${from.month} – ${to.month} ${to.year}`;
  return `${from.month} ${from.year} – ${to.month} ${to.year}`;
}

/** "2022 – 2026". */
export function yearRange(start, end) {
  const from = parts(start)?.year;
  const to = parts(end)?.year;
  if (from && to) return from === to ? to : `${from} – ${to}`;
  return from || to || '';
}

export const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

/** "Sneha Reddy" → ["Sneha", "Reddy"]. */
export function splitName(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  return [words[0] || '', words.slice(1).join(' ')];
}

export const initialOf = (name) => (String(name || '').trim().charAt(0) || '?').toUpperCase();

/** "Hyderabad, Telangana" → "Hyderabad". */
export const cityName = (location) => String(location || '').split(',')[0].trim();

/** Description text → bullet lines. */
export const lines = (text) => String(text || '').split('\n').map((line) => line.replace(/^[\s•*-]+/, '').trim()).filter(Boolean);

export const errorCount = (errors) => Object.values(errors).filter(Boolean).length;

/** True when the skill has a bank test, so its score comes only from that test. */
export function skillHasTest(name, techSkills) {
  const key = String(name || '').toLowerCase();
  return hasSkillMcq(name) || (techSkills || []).some((item) => item.name?.toLowerCase() === key && item.hasQuiz);
}
