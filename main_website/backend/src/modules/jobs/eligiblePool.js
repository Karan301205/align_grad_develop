// How many candidates meet a draft job's or gig's skill bars, using exactly the rule
// that decides who may apply. Jobs (skills/skillMatching.service.js getMissingRequirements):
// a bar only blocks applying when the skill is technical AND has active questions in
// the question bank. Gigs (gigSkillGaps): every bar above 1 blocks, against the verified
// score or, without one, the candidate's own rating. Pure functions.

const { buildStudentSkillMap, getMissingRequirements } = require('../skills/skillMatching.service');
const { TECHNICAL_SKILLS } = require('../skills/technicalSkills');
const registryCache = require('../assessments/question-bank/skills/registryCache');

/** True when a bar on `skillName` can stop a candidate from applying. */
function gatesApplying(skillName, quizSkills) {
  const canonical = registryCache.resolve(skillName).toLowerCase();
  return TECHNICAL_SKILLS.has(canonical) && quizSkills.has(canonical);
}

/**
 * Gig rule (gigs/gig.controller.js gigShortfalls and applyToGig): the bars above level 1
 * the candidate is below. Skills without a test, including a recruiter's own skills,
 * are checked against the candidate's self-rating.
 */
function gigSkillGaps(requirements, profile) {
  const skills = (profile && profile.skills) || [];
  return (requirements || [])
    .filter((req) => req && req.skillName && req.minRating > 1)
    .map((req) => {
      const mine = skills.find((s) => s && s.name && s.name.toLowerCase() === req.skillName.toLowerCase());
      const currentRating = mine ? (mine.verifiedRating > 0 ? mine.verifiedRating : (mine.rating || 0)) : 0;
      return { skillName: req.skillName, requiredRating: req.minRating, currentRating, onProfile: Boolean(mine) };
    })
    .filter((gap) => gap.currentRating < gap.requiredRating);
}

/**
 * @param {Array<{ skillName: string, minRating: number }>} requirements
 * @param {Array<{ skills?: Array<{ name: string, rating?: number, verifiedRating?: number }> }>} profiles
 * @param {Set<string>} quizSkills lower-cased skill names with ACTIVE bank questions
 * @param {{ forGig?: boolean }} [options] forGig: count with the gig rule (gigSkillGaps)
 * @returns {{
 *   eligible: number,
 *   total: number,
 *   requirements: Array<{ skillName: string, minRating: number, gates: boolean }>,
 *   bestRelaxation: { skillName: string, from: number, to: number, adds: number } | null
 * }}
 */
function summarizePool(requirements, profiles, quizSkills, { forGig = false } = {}) {
  const job = { requirements };
  let eligible = 0;
  // Candidates who miss exactly one bar, and only by one point, per skill.
  const oneBelow = new Map();

  for (const profile of profiles) {
    const missing = forGig ? gigSkillGaps(requirements, profile) : getMissingRequirements(job, buildStudentSkillMap(profile), quizSkills);
    if (missing.length === 0) {
      eligible += 1;
    } else if (missing.length === 1) {
      const [gap] = missing;
      if (gap.requiredRating > 1 && gap.currentRating === gap.requiredRating - 1) {
        oneBelow.set(gap.skillName, (oneBelow.get(gap.skillName) || 0) + 1);
      }
    }
  }

  let bestRelaxation = null;
  for (const [skillName, adds] of oneBelow) {
    if (!bestRelaxation || adds > bestRelaxation.adds) {
      const from = requirements.find((req) => req.skillName === skillName).minRating;
      bestRelaxation = { skillName, from, to: from - 1, adds };
    }
  }

  return {
    eligible,
    total: profiles.length,
    requirements: requirements.map(({ skillName, minRating }) => ({ skillName, minRating, gates: gatesApplying(skillName, quizSkills) })),
    bestRelaxation
  };
}

module.exports = { summarizePool, gatesApplying, gigSkillGaps };
