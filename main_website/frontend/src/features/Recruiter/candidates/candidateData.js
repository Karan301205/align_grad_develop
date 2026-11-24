// Pure helpers for the recruiter Candidates page. Candidates are cards from
// POST /recruiter/candidates/search or full profiles from GET /recruiter/candidates/:id; jobs
// come from GET /recruiter/jobs (with applications). Filtering, sorting, the filter menus and
// the job comparison run on the server (backend modules/recruiters/candidateSearch.service.js).

export const candidateId = (cand) => cand?.id || cand?._id || '';
export const skillName = (skill) => (typeof skill === 'string' ? skill : skill?.name || '').trim();
const lower = (value) => String(value || '').trim().toLowerCase();

/** The score that counts against a bar: test-verified level first, else the profile level (as the server does). */
export function effectiveScore(skill) {
  if (!skill || typeof skill === 'string') return 0;
  return skill.verifiedRating > 0 ? skill.verifiedRating : skill.rating || 0;
}

export function findSkill(cand, name) {
  const wanted = lower(name);
  return (cand?.skills || []).find((skill) => lower(skillName(skill)) === wanted) || null;
}

const yearOf = (date) => (/^\d{4}/.test(String(date || '')) ? String(date).slice(0, 4) : '');

/** Education entries with a degree or institute, newest end date first. */
function educationEntries(cand) {
  return (Array.isArray(cand?.education) ? cand.education : [])
    .filter((edu) => edu && (edu.degree || edu.institute))
    .sort((a, b) => String(b.endDate || '').localeCompare(String(a.endDate || '')));
}

/** "St. Francis College · B.Com · 2025" from the latest education entry ('' when none). */
export function educationLine(cand) {
  const [edu] = educationEntries(cand);
  if (!edu) return '';
  return [edu.institute, [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' '), yearOf(edu.endDate)].filter(Boolean).join(' · ');
}

/** Jobs a candidate can be compared with: job/internship posts that have skill bars. */
export const comparableJobs = (jobs) =>
  (Array.isArray(jobs) ? jobs : []).filter((job) => job.opportunityType !== 'GIG' && Array.isArray(job.requirements) && job.requirements.length > 0);

/** Drive/Docs/Dropbox resume links open as they are; '' means build the standard resume from the profile. */
export function externalResumeUrl(cand) {
  const raw = String(cand?.resumeUrl || '').trim();
  if (!/drive\.google\.com|docs\.google\.com|dropbox\.com/.test(raw)) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/** The candidate's application to `job`, if any (Application.studentId is the Profile id). */
export const applicationFor = (cand, job) => (job?.applications || []).find((app) => app.studentId === candidateId(cand)) || null;
