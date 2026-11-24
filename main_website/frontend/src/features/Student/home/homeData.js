// Pure helpers for the candidate Home (design: candidate_dashboard_design/Web — home).
// Everything here is computed from the student's jobs (GET /student/jobs),
// applications (GET /student/applications) and profile; nothing is made up.
import { getApplicationStage } from '../../../utils/hiringProgress';

const TILE_COLORS = ['#0167F6', '#7B3FD0', '#B42FB8', '#0F7A55', '#C2410C', '#1B2B55', '#4F5FE0', '#0E7490'];

/** Same colour for the same company every time. */
export function tileColor(name) {
  let hash = 0;
  for (const char of String(name || '')) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return TILE_COLORS[Math.abs(hash) % TILE_COLORS.length];
}

export const companyOf = (job) => String(job?.companyName || job?.company?.name || '').replace(/^c_/i, '').trim();
export const initialOf = (text) => (String(text || '').trim().charAt(0) || '?').toUpperCase();

/** "Gachibowli", "Remote"; '' when the job gives no place. */
export function placeText(job) {
  const place = String(job?.location || job?.workMode || '').trim();
  if (!place) return '';
  return /home|remote|wfh/i.test(place) ? 'Remote' : place;
}

/** "₹24,000/month" from the job's pay fields; '' when none is given. */
export function payText(job) {
  if (!job) return '';
  if (job.showSalary === false) return 'Pay not shown';
  const amount = (value) => {
    const text = String(value ?? '').trim().replace(/^₹\s*/, '');
    if (!text) return '';
    const number = Number(text.replace(/,/g, ''));
    return Number.isFinite(number) && number > 0 ? number.toLocaleString('en-IN') : text;
  };
  const full = amount(job.stipendFullTime || job.stipendFull);
  const part = amount(job.stipendPartTime || job.stipendPart);
  if (full && part && full !== part) return `₹${part} – ₹${full}/month`;
  const single = full || part || amount(job.salary) || amount(job.stipend);
  if (!single) return '';
  return /month|\/mo/i.test(single) ? `₹${single}` : `₹${single}/month`;
}

const requirementCount = (job) => (Array.isArray(job?.requirements) ? job.requirements.length : 0);

/** "You meet all 3 skill bars", "You meet both skill bars", "You meet the skill bar". */
export function barsText(job) {
  const count = requirementCount(job);
  if (count === 0) return 'No skill bars to meet';
  if (count === 1) return 'You meet the skill bar';
  if (count === 2) return 'You meet both skill bars';
  return `You meet all ${count} skill bars`;
}

const byScore = (a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0);

/** Jobs not applied to yet, best match first (also the job brief's Previous/Next order). */
export const openJobs = (jobs) => jobs.filter((job) => !job.applied).sort(byScore);

/** Jobs the candidate meets every bar for and hasn't applied to. */
export const applyNowJobs = (jobs) => openJobs(jobs).filter((job) => job.matched);

/** Jobs exactly one skill bar away (that skill has a test, so it can be raised). */
export const oneSkillAwayJobs = (jobs) => openJobs(jobs).filter((job) => Array.isArray(job.missingRequirements) && job.missingRequirements.length === 1);

/** "Python 7, needs 8" / "Python not added, needs 6". */
export function gapText(missing) {
  if (!missing) return '';
  const current = Number(missing.currentRating) || 0;
  if (missing.hasQuiz === false) return `${missing.skillName} not on your profile`;
  return current > 0 ? `${missing.skillName} ${current}, needs ${missing.requiredRating}` : `${missing.skillName} not on your profile, needs ${missing.requiredRating}`;
}

export const STAGES = {
  APPLIED: { label: 'Applied', tone: 'bg-[#E8EEFF] text-[#0B3FA8]' },
  SHORTLISTED: { label: 'Shortlisted', tone: 'bg-[#F1ECFF] text-[#5B2AA6]' },
  INTERVIEW: { label: 'Interviews', tone: 'bg-[#FFF3E0] text-[#8A3F06]' },
  HIRED: { label: 'Selected', tone: 'bg-[#E3F5EE] text-[#0B5E41]' },
  REJECTED: { label: 'Not progressed', tone: 'bg-[#FDECEA] text-[#9F1C13]' }
};

/** The round the candidate is in now: scheduled or in progress, else the next pending one. */
export function currentRound(app) {
  const rounds = Array.isArray(app?.roundStatuses) ? app.roundStatuses : [];
  const status = (round) => String(round?.status || '').toUpperCase();
  const live = rounds.find((round) => ['SCHEDULED', 'IN_PROGRESS'].includes(status(round)));
  return live || rounds.find((round) => status(round) === 'PENDING') || null;
}

export const roundText = (round) => (round ? [round.roundNumber ? `Round ${round.roundNumber}` : '', round.name].filter(Boolean).join(' · ') : '');

/** Counts per pipeline stage (same rules as Your Job Progress). */
export function pipelineCounts(applications) {
  const counts = { APPLIED: 0, SHORTLISTED: 0, INTERVIEW: 0, HIRED: 0, REJECTED: 0, total: applications.length };
  applications.forEach((app) => {
    counts[getApplicationStage(app)] += 1;
  });
  return counts;
}

/** Funnel: how many applications reached each step (later steps count as having passed earlier ones). */
export function funnelSteps(counts) {
  const total = counts.total;
  const reached = [total, counts.SHORTLISTED + counts.INTERVIEW + counts.HIRED, counts.INTERVIEW + counts.HIRED, counts.HIRED];
  return ['Applied', 'Shortlisted', 'Interviews', 'Selected'].map((label, index) => ({
    label,
    count: reached[index],
    percent: total ? Math.round((reached[index] / total) * 100) : 0
  }));
}

/**
 * The skills most asked for across open jobs (top 6), how many jobs ask for each,
 * and whether the candidate has them. `alignment` = share of those 6 they have.
 */
export function marketDemand(jobs, skills) {
  if (!jobs.length) return { top: [], alignment: 0 };
  const map = new Map();
  jobs.forEach((job) => {
    const seen = new Set();
    (Array.isArray(job.requirements) ? job.requirements : []).forEach((req) => {
      const name = String(typeof req === 'string' ? req : req?.skillName || req?.name || '').trim();
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return;
      seen.add(key);
      const entry = map.get(key) || { name, key, jobCount: 0, ratingSum: 0 };
      entry.jobCount += 1;
      entry.ratingSum += typeof req === 'object' && req.minRating > 0 ? req.minRating : 1;
      map.set(key, entry);
    });
  });
  const mine = new Map((skills || []).filter((skill) => skill?.name).map((skill) => [skill.name.toLowerCase(), skill]));
  const top = [...map.values()]
    .sort((a, b) => b.jobCount - a.jobCount || b.ratingSum / b.jobCount - a.ratingSum / a.jobCount)
    .slice(0, 6)
    .map((entry) => {
      const skill = mine.get(entry.key);
      return {
        ...entry,
        percent: Math.round((entry.jobCount / jobs.length) * 100),
        avgRating: Math.round(entry.ratingSum / entry.jobCount),
        has: Boolean(skill),
        rating: skill ? skill.verifiedRating || skill.rating || 0 : 0,
        verified: Boolean(skill?.verifiedRating)
      };
    });
  return { top, alignment: top.length ? Math.round((top.filter((item) => item.has).length / top.length) * 100) : 0 };
}

export function greeting(now = new Date()) {
  const hour = now.getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export const todayText = (now = new Date()) => now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
