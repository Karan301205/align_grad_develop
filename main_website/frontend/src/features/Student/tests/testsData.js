// Rules for the candidate Skills & tests page (design: candidate_test_design).
// Skills come from GET /student/tests/skills (technical skills on the profile, with
// hasQuiz and testedAt), the profile (every skill) and GET /student/jobs (skill bars,
// missingRequirements, requirementStatuses).
import { ALL_SKILLS } from '../../../constants';
import { formatShortDate } from '../../../utils/format';
import { companyOf } from '../home/homeData';

export { formatShortDate };

/** Right answers needed for a verified score (the server's passMark for 10 questions). */
export const PASS_MARK = 7;
/** A test session lasts 30 minutes on the server (TestSession.expiresAt). */
export const TEST_MINUTES = 30;

export const SKILL_NAMES = [...new Set(ALL_SKILLS.map((item) => item.skill))];

const key = (name) => String(name || '').trim().toLowerCase();

/** The score recruiters see: the verified score, else the latest rating. */
export const scoreOf = (skill) => (skill ? (skill.verifiedRating > 0 ? skill.verifiedRating : skill.rating || 0) : 0);

const jobLabel = (job) => [job.title, companyOf(job)].filter(Boolean).join(' · ');
const hasTestFor = (job, skillName) => {
  const status = (job.requirementStatuses || []).find((item) => key(item.skillName) === key(skillName));
  return !status || (status.isTech !== false && status.hasQuiz !== false);
};

/**
 * "Raise these to unlock jobs": skills that are the only bar between the candidate
 * and a job, and that have a test. Smallest gap first, then most jobs.
 */
export function skillGaps(jobs, skills, limit = 4) {
  const mine = new Map((skills || []).map((skill) => [key(skill.name), skill]));
  const bySkill = new Map();
  jobs
    .filter((job) => !job.applied && (job.missingRequirements || []).length === 1)
    .forEach((job) => {
      const gap = job.missingRequirements[0];
      if (!hasTestFor(job, gap.skillName)) return;
      const entry = bySkill.get(key(gap.skillName)) || { name: gap.skillName, score: scoreOf(mine.get(key(gap.skillName))), need: Infinity, jobs: [] };
      entry.need = Math.min(entry.need, Number(gap.requiredRating) || 0);
      entry.jobs.push(job);
      bySkill.set(key(gap.skillName), entry);
    });
  return [...bySkill.values()]
    .map((entry) => ({ ...entry, opens: jobLabel(entry.jobs[0]), more: entry.jobs.length - 1 }))
    .sort((a, b) => a.need - a.score - (b.need - b.score) || b.jobs.length - a.jobs.length)
    .slice(0, limit);
}

/** "Meets the bar on 5 jobs", "2 jobs need 8", "Not asked for in open jobs". */
export function jobsLine(skillName, score, jobs) {
  const bars = jobs.map((job) => (job.requirements || []).find((req) => key(req.skillName) === key(skillName))).filter(Boolean);
  if (bars.length === 0) return 'Not asked for in open jobs';
  const above = bars.filter((bar) => Number(bar.minRating) > score);
  if (above.length === 0) return `Meets the bar on ${bars.length} job${bars.length === 1 ? '' : 's'}`;
  const need = Math.min(...above.map((bar) => Number(bar.minRating)));
  return `${above.length} job${above.length === 1 ? ' needs' : 's need'} ${need}${above.length > 1 ? '+' : ''}`;
}

/** The job a skill would unlock at a score (for the test intro), or null. */
export function unlockFor(skillName, jobs) {
  const gap = skillGaps(jobs, [], 50).find((entry) => key(entry.name) === key(skillName));
  return gap ? { need: gap.need, opens: gap.opens } : null;
}

/** "Test a new skill" suggestions: testable skills open jobs ask for that aren't on the profile. */
export function suggestedSkills(jobs, skills, limit = 4) {
  const have = new Set((skills || []).map((skill) => key(skill.name)));
  const counts = new Map();
  jobs
    .filter((job) => !job.applied)
    .forEach((job) =>
      (job.requirements || []).forEach((req) => {
        if (!req.skillName || have.has(key(req.skillName)) || !hasTestFor(job, req.skillName)) return;
        const entry = counts.get(key(req.skillName)) || { name: req.skillName, count: 0 };
        entry.count += 1;
        counts.set(key(req.skillName), entry);
      })
    );
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, limit);
}

/**
 * Splits skills for the page: tested / testable (a test exists) and self-rated
 * (no test: technical skills the bank doesn't cover yet, and every other skill).
 */
export function splitSkills(profileSkills, techSkills) {
  const tech = new Map((techSkills || []).map((skill) => [key(skill.name), skill]));
  const testable = [];
  const selfRated = [];
  (profileSkills || [])
    .filter((skill) => skill?.name)
    .forEach((skill) => {
      const info = tech.get(key(skill.name));
      if (info?.hasQuiz) testable.push({ ...skill, ...info });
      else selfRated.push({ ...skill, technical: Boolean(info) });
    });
  return { testable, selfRated };
}

/** A question's text split into its prompt and any ```code``` blocks (with language). */
export function parseQuestion(text) {
  const parts = String(text || '').split(/(```[\s\S]*?```)/g);
  const blocks = [];
  parts.forEach((part) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3).replace(/^\n+|\n+$/g, '').split('\n');
      const lang = /^[a-zA-Z0-9_+#.-]+$/.test(lines[0]?.trim() || '') && lines.length > 1 ? lines.shift().trim() : '';
      blocks.push({ type: 'code', lang, code: lines.join('\n') });
    } else if (part.trim()) {
      blocks.push({ type: 'text', text: part.trim() });
    }
  });
  const prompt = blocks[0]?.type === 'text' ? blocks.shift().text : '';
  return { prompt, blocks };
}

/** Options that read as code (short values, names or expressions) get a monospace font. */
export const looksLikeCode = (options) => options.every((option) => String(option).length <= 32 && (!/\s/.test(String(option)) || /[()[\]{}=<>"'_]/.test(String(option))));

/** "24:05" */
export const clock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Subtopics to work on: any with a wrong answer, weakest first. */
export const focusTopics = (topics) =>
  (topics || [])
    .filter((topic) => topic.correct < topic.total)
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.total - a.total);
