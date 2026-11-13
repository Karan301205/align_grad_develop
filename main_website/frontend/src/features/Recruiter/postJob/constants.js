// Post-a-job wizard (design: design/jobs_recruiter). The option lists below are the
// values already stored on jobs and shown to candidates; changing a label changes
// what new jobs store, so keep them as they are.

export const OPPORTUNITY_TYPES = [
  { value: 'JOB', title: 'Job', desc: 'Permanent role with a monthly salary', noun: 'job', pay: 'Salary' },
  { value: 'INTERNSHIP', title: 'Internship', desc: 'Fixed duration with a monthly stipend', noun: 'internship', pay: 'Stipend' }
];
export const opportunityMeta = (value) => OPPORTUNITY_TYPES.find((type) => type.value === value) || OPPORTUNITY_TYPES[0];

// Which pay field a post fills: Job.stipendFullTime or Job.stipendPartTime.
export const HOURS = ['Full-time', 'Part-time'];

export const WORK_MODE_OPTIONS = ['Work from office', 'Remote', 'Hybrid'];

export const EDUCATION_OPTIONS = [
  'Any Graduate / Postgraduate',
  'B.Tech / B.E. (Engineering / Tech)',
  'BCA / MCA (Computer Applications)',
  'B.Sc / M.Sc (Computer Science / IT)',
  'BBA / MBA (Business & Management)',
  'B.Com / M.Com (Finance & Commerce)',
  'Diploma / Polytechnic',
  'Doctorate / PhD',
  'Other Non-Technical Degree'
];

export const EXPERIENCE_OPTIONS = ['0-1 Years', '1-2 Years', '2-3 Years', '3-4 Years', '4-5 Years', 'More than 5 Years'];

export const JOINING_OPTIONS = [
  'Immediate', 'Within 15 Days', 'Within 1 Month', 'Next Month',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const STEPS = [
  { id: 'basics', title: 'Basics', hint: 'Role and location' },
  { id: 'skills', title: 'Skills & bars', hint: 'Minimum scores' },
  { id: 'pay', title: 'Pay & dates', hint: 'Salary, joining' },
  { id: 'process', title: 'Hiring process', hint: 'Rounds, questions' },
  { id: 'review', title: 'Review & publish', hint: 'Check and publish' }
];

// Skill scores are out of 10 (same scale as candidate skill tests).
export const LEVEL_BANDS = [
  { range: '1–3', label: 'Beginner', desc: 'Knows the basics', max: 3 },
  { range: '4–6', label: 'Working', desc: 'Can do routine tasks with help', max: 6 },
  { range: '7–8', label: 'Job-ready', desc: 'Works independently', max: 8 },
  { range: '9–10', label: 'Expert', desc: 'Rare among freshers', max: 10 }
];
export const levelLabel = (score) => LEVEL_BANDS.find((band) => score <= band.max)?.label || '';
export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const NEW_SKILL_LEVEL = 4; // starting bar for an added skill (same as the previous form)
export const MAX_SKILLS = 30; // server limit for the candidate count
