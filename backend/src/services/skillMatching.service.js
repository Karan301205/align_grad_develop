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

// Builds a case-insensitive lookup of a candidate's skills:
//   { "react": { rating: 1, verifiedRating: 4, isVerified: true }, ... }
function buildStudentSkillMap(profile) {
  const studentSkills = {};
  if (profile && profile.skills) {
    profile.skills.forEach(s => {
      studentSkills[registryCache.resolve(s.name).toLowerCase()] = {
        rating: s.rating || 0,
        verifiedRating: s.verifiedRating || 0,
        isVerified: Boolean(s.verifiedRating && s.verifiedRating > 0)
      };
    });
  }
  return studentSkills;
}

// Returns the list of technical requirements the candidate falls short on.
// A requirement is only satisfied if the candidate has passed the verification test
// and obtained a verifiedRating >= minRating.
function getMissingRequirements(job, studentSkills) {
  const missingRequirements = [];
  if (job && job.requirements) {
    job.requirements.forEach(reqSkill => {
      const canonical = registryCache.resolve(reqSkill.skillName).toLowerCase();
      const isTech = TECHNICAL_SKILLS.has(canonical);
      if (isTech) {
        const studentSkillData = studentSkills[canonical];
        const isPresent = Boolean(studentSkillData);
        const verifiedRating = typeof studentSkillData === 'object'
          ? (studentSkillData.verifiedRating || 0)
          : (typeof studentSkillData === 'number' ? studentSkillData : 0);
        const selfRating = typeof studentSkillData === 'object'
          ? (studentSkillData.rating || 0)
          : verifiedRating;

        if (verifiedRating < reqSkill.minRating) {
          missingRequirements.push({
            skillName: reqSkill.skillName,
            requiredRating: reqSkill.minRating,
            currentRating: verifiedRating,
            selfRating: selfRating,
            isMissingFromProfile: !isPresent,
            isUnverified: isPresent && (!verifiedRating || verifiedRating < reqSkill.minRating)
          });
        }
      }
    });
  }
  return missingRequirements;
}

module.exports = { buildStudentSkillMap, getMissingRequirements };
