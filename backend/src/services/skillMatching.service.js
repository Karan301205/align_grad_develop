// TODO(question-bank Plan 5): TECHNICAL_SKILLS should be derived from the
// SkillDefinition registry rather than a hand-maintained set. Until then,
// registry skills missing from this set (e.g. Redis, GraphQL) will not gate
// applications. Tracked in docs/superpowers/specs/2026-07-18-question-bank-spine-design.md
const { TECHNICAL_SKILLS } = require('../constants/technicalSkills');
const registryCache = require('./questionBank/skills/registryCache');

// Both the map keys and the lookup key are resolved through the registry, so a
// profile storing "next js" still matches a requirement storing "Next.js".
// When the registry is unloaded, resolve() returns its input unchanged and this
// behaves exactly as it did before.

// Builds a case-insensitive lookup of a candidate's self-rated skills:
//   { "react": 8, "css": 6, ... }
function buildStudentSkillMap(profile) {
  const studentSkills = {};
  if (profile && profile.skills) {
    profile.skills.forEach(s => {
      studentSkills[registryCache.resolve(s.name).toLowerCase()] = s.rating;
    });
  }
  return studentSkills;
}

// Returns the list of technical requirements the candidate falls short on.
// Only technical skills (present in TECHNICAL_SKILLS) gate an application;
// non-technical requirements are ignored, matching the original controller logic.
function getMissingRequirements(job, studentSkills) {
  const missingRequirements = [];
  if (job && job.requirements) {
    job.requirements.forEach(reqSkill => {
      const canonical = registryCache.resolve(reqSkill.skillName).toLowerCase();
      const isTech = TECHNICAL_SKILLS.has(canonical);
      if (isTech) {
        const studentRating = studentSkills[canonical] || 0;
        if (studentRating < reqSkill.minRating) {
          missingRequirements.push({
            skillName: reqSkill.skillName,
            requiredRating: reqSkill.minRating,
            currentRating: studentRating
          });
        }
      }
    });
  }
  return missingRequirements;
}

module.exports = { buildStudentSkillMap, getMissingRequirements };
