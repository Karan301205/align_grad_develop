// Rules for the candidate Jobs page (design: candidate_jobs_design). Everything is
// computed from GET /student/jobs (matched, missingRequirements, requirementStatuses,
// applied, recommendationScore) and the candidate's skills.
import { compareByRecommendation } from '../../../utils/jobAccess';
import { formatLongDate, formatShortDate } from '../../../utils/format';

export { companyOf, initialOf, payText, placeText, tileColor, gapText } from '../home/homeData';

/* ------------------------------------------------------------------ labels */

/** "Full-time job", "Part-time internship · 6 months", "Internship". */
export function kindText(job) {
  const noun = job?.opportunityType === 'INTERNSHIP' ? 'internship' : 'job';
  const hours = job?.stipendFullTime ? 'Full-time' : job?.stipendPartTime ? 'Part-time' : '';
  const kind = hours ? `${hours} ${noun}` : noun.charAt(0).toUpperCase() + noun.slice(1);
  return job?.duration && noun === 'internship' ? `${kind} · ${job.duration}` : kind;
}

/** "Today", "Yesterday", "3 days ago", "2 weeks ago", else the date. */
export function postedText(value, now = new Date()) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const days = Math.floor((now - date) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 28) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
  return formatShortDate(date);
}

/** Last day the job takes applications (posted date + active days). */
export function closesText(job) {
  if (!job?.createdAt || !job?.activeDays) return '';
  const date = new Date(job.createdAt);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + Number(job.activeDays));
  return formatLongDate(date);
}

/* ------------------------------------------------------------ skill bars */

/**
 * Each skill bar of the job against the candidate's score. Skills without a test
 * in the bank only need to be on the profile (same rule as the server).
 */
export function evaluateBars(job, skills) {
  const mine = new Map((skills || []).filter((skill) => skill?.name).map((skill) => [skill.name.toLowerCase(), skill]));
  const statuses = new Map((job?.requirementStatuses || []).map((status) => [String(status.skillName || '').toLowerCase(), status]));
  return (job?.requirements || []).map((req) => {
    const key = String(req.skillName || '').toLowerCase();
    const skill = mine.get(key);
    const status = statuses.get(key);
    const score = skill ? skill.verifiedRating || skill.rating || 0 : 0;
    const hasTest = status ? status.isTech !== false && status.hasQuiz !== false : true;
    return {
      skillName: req.skillName,
      needs: Number(req.minRating) || 0,
      score,
      hasSkill: Boolean(skill),
      hasTest,
      met: score >= (Number(req.minRating) || 0) || (!hasTest && Boolean(skill))
    };
  });
}

/** 'applied' | 'can' (meets every bar) | 'away' (one bar short) | 'far'. */
export function jobStatus(job) {
  if (job?.applied) return 'applied';
  const missing = Array.isArray(job?.missingRequirements) ? job.missingRequirements.length : 0;
  if (job?.matched || missing === 0) return 'can';
  return missing === 1 ? 'away' : 'far';
}

/* ------------------------------------------------------------------ tabs */

export const TABS = [
  { id: 'can', label: 'Can apply' },
  { id: 'away', label: '1 skill away' },
  { id: 'all', label: 'All jobs' },
  { id: 'applied', label: 'Applied' }
];

export const inTab = (job, tab) => (tab === 'all' ? true : jobStatus(job) === tab);

/** Tab to show a job in when it is opened from elsewhere (Home, a link, a company page). */
export const tabFor = (job) => (jobStatus(job) === 'far' ? 'all' : jobStatus(job));

/* --------------------------------------------------------------- filters */

export const SORTS = [
  { value: 'recommended', label: 'Best match' },
  { value: 'newest', label: 'Newest first' },
  { value: 'pay_desc', label: 'Pay: high to low' },
  { value: 'pay_asc', label: 'Pay: low to high' },
  { value: 'title_asc', label: 'Title: A to Z' }
];

export const ROLES = [
  { value: 'all', label: 'All roles' },
  { value: 'internship', label: 'Internship' },
  { value: 'fulltime', label: 'Full-time' }
];

export const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'not_applied', label: 'Not applied' },
  { value: 'applied', label: 'Applied' }
];

export const PAY_PRESETS = [
  { label: 'Under ₹15k', min: '', max: '15000' },
  { label: '₹15k – ₹40k', min: '15000', max: '40000' },
  { label: '₹40k – ₹80k', min: '40000', max: '80000' },
  { label: '₹80k+', min: '80000', max: '' }
];

export const EMPTY_FILTERS = { search: '', sort: 'recommended', role: 'all', location: '', skills: [], minPay: '', maxPay: '', status: 'all' };

/** Monthly pay as a number for sorting and the pay range (0 when hidden or missing). */
export function payNumber(job) {
  if (!job || job.showSalary === false) return 0;
  const raw = job.stipendFullTime || job.stipendFull || job.salary || job.stipendPartTime || job.stipend || 0;
  const number = parseInt(String(raw).replace(/[^\d]/g, ''), 10);
  return Number.isNaN(number) ? 0 : number;
}

/** Number of filters that differ from the defaults (shown on the Filters button). */
export const activeFilterCount = (filters) =>
  [filters.sort !== 'recommended', filters.role !== 'all', Boolean(filters.location.trim()), filters.skills.length > 0, Boolean(filters.minPay || filters.maxPay), filters.status !== 'all'].filter(Boolean).length;

/** Same filters as the previous Opportunities page: search, role, location, skills, pay range, status. */
export function matchesFilters(job, filters) {
  if (filters.status === 'applied' && !job.applied) return false;
  if (filters.status === 'not_applied' && job.applied) return false;

  if (filters.role !== 'all') {
    const type = String(job.opportunityType || '').toLowerCase();
    const title = String(job.title || '').toLowerCase();
    if (filters.role === 'internship' && !type.includes('intern') && !title.includes('intern')) return false;
    if (filters.role === 'fulltime' && !type.includes('full') && !title.includes('developer') && !title.includes('engineer') && !type.includes('job')) return false;
  }

  const location = filters.location.trim().toLowerCase();
  if (location) {
    const place = String(job.location || job.workMode || '').toLowerCase();
    if (location === 'remote') {
      if (!place.includes('home') && !place.includes('remote') && place !== 'wfh') return false;
    } else if (!place.includes(location.split(',')[0].trim())) return false;
  }

  const query = filters.search.trim().toLowerCase();
  if (query) {
    const company = String(job.companyName || job.company?.name || '').toLowerCase();
    const inSkills = (job.requirements || []).some((req) => String(req.skillName || '').toLowerCase().includes(query));
    const inPlace = String(job.location || '').toLowerCase().includes(query);
    if (!String(job.title || '').toLowerCase().includes(query) && !company.includes(query) && !inSkills && !inPlace) return false;
  }

  if (filters.skills.length) {
    const names = (job.requirements || []).map((req) => String(req.skillName || '').toLowerCase());
    if (!filters.skills.some((skill) => names.some((name) => name.includes(skill.toLowerCase())))) return false;
  }

  const pay = payNumber(job);
  const min = parseInt(filters.minPay, 10);
  const max = parseInt(filters.maxPay, 10);
  if (!Number.isNaN(min) && pay > 0 && pay < min) return false;
  if (!Number.isNaN(max) && pay > 0 && pay > max) return false;
  return true;
}

export function sortJobs(list, sort) {
  const sorted = [...list];
  if (sort === 'newest') return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  if (sort === 'pay_desc') return sorted.sort((a, b) => payNumber(b) - payNumber(a));
  if (sort === 'pay_asc') return sorted.sort((a, b) => payNumber(a) - payNumber(b));
  if (sort === 'title_asc') return sorted.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
  return sorted.sort(compareByRecommendation);
}

/** Description text → bullet lines. */
export const lines = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => line.replace(/^[\s•*-]+/, '').trim())
    .filter(Boolean);
