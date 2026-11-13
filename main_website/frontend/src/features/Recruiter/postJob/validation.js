import { validateScreeningQuestions } from '../../../constants/screeningQuestions';
import { isValidUrl, withProtocol } from '../companyProfile/validation';
import { STEPS } from './constants';

// Same limits the server enforces (recruiter.validator.js postJobSchema) and the
// previous form checked.
const TITLE_MIN = 3;
const TEXT_MIN = 10;

// Job titles: letters, spaces and the separators titles use ("Data Analyst – Fresher", "C++ / C#").
export const keepTitleChars = (value) => value.replace(/[^a-zA-Z\s\-–&/().,+#]/g, '');
export const keepDigits = (value) => value.replace(/[^0-9]/g, '');
export const keepUrlChars = (value) => value.replace(/[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]/g, '');

const blank = (value) => !String(value ?? '').trim();
const positiveInt = (value) => /^\d+$/.test(String(value)) && Number(value) >= 1;

/** Field errors for one step, in on-screen order (the first one gets focus). */
export function validateStep(stepId, v) {
  const errors = {};
  if (stepId === 'basics') {
    if (blank(v.title)) errors.title = 'Add a job title.';
    else if (v.title.trim().length < TITLE_MIN) errors.title = `The job title needs at least ${TITLE_MIN} characters.`;
    if (blank(v.location)) errors.location = 'Add where the job is based.';
    if (!blank(v.locationUrl) && !isValidUrl(v.locationUrl)) errors.locationUrl = 'Enter a valid link, for example https://maps.google.com/…';
    if (!positiveInt(v.openings)) errors.openings = 'Openings must be at least 1.';
  }
  if (stepId === 'skills') {
    if (v.requirements.length === 0) errors.requirements = 'Add at least one skill with a minimum score.';
  }
  if (stepId === 'pay') {
    if (v.opportunityType === 'INTERNSHIP' && !positiveInt(v.duration)) errors.duration = 'Add how many months the internship lasts.';
    if (!positiveInt(v.activeDays)) errors.activeDays = 'Keep the listing open for at least 1 day.';
  }
  if (stepId === 'process') {
    if (blank(v.description)) errors.description = 'Describe what the job is about.';
    else if (v.description.trim().length < TEXT_MIN) errors.description = `Write at least ${TEXT_MIN} characters about the job.`;
    if (blank(v.responsibilities)) errors.responsibilities = 'List the day-to-day responsibilities.';
    else if (v.responsibilities.trim().length < TEXT_MIN) errors.responsibilities = `Write at least ${TEXT_MIN} characters of responsibilities.`;
    const questionProblem = validateScreeningQuestions(v.screeningQuestions);
    if (questionProblem) errors.screeningQuestions = questionProblem;
  }
  if (stepId === 'review') {
    if (!v.confirmed) errors.confirmed = 'Confirm the position is real before publishing.';
  }
  return errors;
}

/** POST /recruiter/jobs body. Company fields come from the company profile. */
export function buildPayload(v, company) {
  const isInternship = v.opportunityType === 'INTERNSHIP';
  const title = v.title.trim();
  return {
    opportunityType: v.opportunityType,
    title,
    designation: title,
    workMode: v.workMode,
    companyName: company?.name || '',
    officialWebsite: company?.website ? withProtocol(company.website) : '',
    location: v.location.trim(),
    locationUrl: blank(v.locationUrl) ? '' : withProtocol(v.locationUrl),
    openings: Number(v.openings),
    preferredEducation: v.preferredEducation,
    desiredExperience: v.desiredExperience,
    requirements: v.requirements.map(({ skillName, minRating }) => ({ skillName, minRating })),
    showSalary: v.showSalary,
    stipendFullTime: v.hours === 'Full-time' ? v.salary : '',
    stipendPartTime: v.hours === 'Part-time' ? v.salary : '',
    duration: isInternship ? `${Number(v.duration)} Months` : null,
    joiningMonth: v.joiningMonth,
    activeDays: Number(v.activeDays),
    description: v.description.trim(),
    roleResponsibilities: v.responsibilities.trim(),
    selectionProcess: v.rounds.map((round, index) => ({ roundNumber: index + 1, name: round.name, description: round.description })),
    screeningQuestions: v.screeningQuestions
  };
}

// Server messages (validator or controller) → the step that holds the field.
const STEP_KEYWORDS = [
  ['skills', ['requirement', 'skill', 'minrating']],
  ['pay', ['duration', 'stipend', 'salary', 'activedays', 'joining']],
  ['process', ['description', 'responsibilit', 'round', 'screening', 'question', 'option']],
  ['basics', ['title', 'designation', 'location', 'openings', 'workmode', 'education', 'experience', 'website']]
];

/** Index of the step a server error belongs to, or null when it isn't about a field. */
export function stepForServerError(message) {
  const lower = String(message || '').toLowerCase().replace(/\s+/g, '');
  const match = STEP_KEYWORDS.find(([, words]) => words.some((word) => lower.includes(word)));
  return match ? STEPS.findIndex((step) => step.id === match[0]) : null;
}

/** "9 Dec 2026": the day a listing open for `days` from today is removed. */
export function closingDate(days) {
  if (!positiveInt(days)) return '';
  const date = new Date();
  date.setDate(date.getDate() + Number(days));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "25,000" for the digits "25000". */
export const formatAmount = (digits) => (digits ? Number(digits).toLocaleString('en-IN') : '');
