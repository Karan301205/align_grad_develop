// Pure helpers for the recruiter Candidates page. Candidates are Profile rows from
// GET /recruiter/candidates; jobs come from GET /recruiter/jobs (with applications).

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

/**
 * Key that treats "B.Tech", "b.tech", "B. Tech" and "BTECH" as the same value:
 * case, spacing and punctuation are ignored. Synonyms ("Bachelor of Technology")
 * stay separate.
 */
export const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const tidy = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const capitals = (value) => (value.match(/[A-Z]/g) || []).length;
// Prefer normal mixed-case spellings ("Osmania University") over ALL CAPS or all lower case.
const mixedCase = (value) => (/[a-z]/.test(value) && /[A-Z]/.test(value) ? 1 : 0);

/**
 * One option per normalised value, labelled with its most common spelling.
 * Ties: mixed case first, then more capitals ("B.Tech" over "B.tech"), then shorter, then A–Z.
 */
function mergedOptions(values) {
  const groups = new Map();
  values.forEach((raw) => {
    const label = tidy(raw);
    const key = normalizeKey(label);
    if (!key) return;
    const spellings = groups.get(key) || new Map();
    spellings.set(label, (spellings.get(label) || 0) + 1);
    groups.set(key, spellings);
  });
  return [...groups.values()]
    .map(
      (spellings) =>
        [...spellings.entries()].sort(
          (a, b) => b[1] - a[1] || mixedCase(b[0]) - mixedCase(a[0]) || capitals(b[0]) - capitals(a[0]) || a[0].length - b[0].length || a[0].localeCompare(b[0])
        )[0][0]
    )
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/** Colleges, degrees and graduation years across the pool, for the filter menus (duplicates merged). */
export function educationOptions(candidates) {
  const colleges = [];
  const degrees = [];
  const years = new Set();
  candidates.forEach((cand) =>
    educationEntries(cand).forEach((edu) => {
      if (edu.institute) colleges.push(edu.institute);
      if (edu.degree) degrees.push(edu.degree);
      const year = yearOf(edu.endDate);
      if (year) years.add(year);
    })
  );
  return { colleges: mergedOptions(colleges), degrees: mergedOptions(degrees), years: [...years].sort((a, b) => b.localeCompare(a)) };
}

export const hasEducation = (cand, { college, degree, year }) =>
  educationEntries(cand).some(
    (edu) =>
      (!college || normalizeKey(edu.institute) === normalizeKey(college)) &&
      (!degree || normalizeKey(edu.degree) === normalizeKey(degree)) &&
      (!year || yearOf(edu.endDate) === year)
  );

/** Jobs a candidate can be compared with: job/internship posts that have skill bars. */
export const comparableJobs = (jobs) =>
  (Array.isArray(jobs) ? jobs : []).filter((job) => job.opportunityType !== 'GIG' && Array.isArray(job.requirements) && job.requirements.length > 0);

/**
 * A candidate against a job's bars. `gates` (from POST /recruiter/jobs/eligible-count)
 * says which bars can stop someone applying; bars without a skill test are shown
 * but never make a candidate "short".
 * @returns {{ bars: Array<{ skillName, minRating, score, state: 'above'|'meets'|'below', gates: boolean }>, short: number, meetsAll: boolean }}
 */
export function compareWithJob(cand, job, gatesBySkill) {
  const bars = (job?.requirements || []).map(({ skillName: name, minRating }) => {
    const score = effectiveScore(findSkill(cand, name));
    const gates = gatesBySkill?.has(name) ? gatesBySkill.get(name) : true;
    return { skillName: name, minRating, score, gates, state: score > minRating ? 'above' : score === minRating ? 'meets' : 'below' };
  });
  const short = bars.filter((bar) => bar.gates && bar.state === 'below').length;
  return { bars, short, meetsAll: short === 0 };
}

/** Drive/Docs/Dropbox resume links open as they are; '' means build the standard resume from the profile. */
export function externalResumeUrl(cand) {
  const raw = String(cand?.resumeUrl || '').trim();
  if (!/drive\.google\.com|docs\.google\.com|dropbox\.com/.test(raw)) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/** The candidate's application to `job`, if any (Application.studentId is the Profile id). */
export const applicationFor = (cand, job) => (job?.applications || []).find((app) => app.studentId === candidateId(cand)) || null;
