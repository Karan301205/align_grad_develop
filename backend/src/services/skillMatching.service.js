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
// (verifiedRating >= minRating) OR if the skill does not have a quiz generated yet
// in the Question Bank (in which case it is temporarily auto-verified for now).
function getMissingRequirements(job, studentSkills, skillsWithQuestionsSet = null) {
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

        // Check if question bank has MCQs generated for this skill yet
        const hasQuizInBank = skillsWithQuestionsSet ? skillsWithQuestionsSet.has(canonical) : true;

        // If candidate lacks verified rating AND the skill has an active quiz in the bank,
        // it gates the application. If the skill has NO quiz in the bank yet, it is auto-verified for now.
        if (verifiedRating < reqSkill.minRating) {
          if (hasQuizInBank) {
            missingRequirements.push({
              skillName: reqSkill.skillName,
              requiredRating: reqSkill.minRating,
              currentRating: verifiedRating,
              selfRating: selfRating,
              isMissingFromProfile: !isPresent,
              isUnverified: isPresent && (!verifiedRating || verifiedRating < reqSkill.minRating),
              hasQuiz: true,
              autoVerifiedForNow: false
            });
          }
        }
      }
    });
  }
  return missingRequirements;
}

// Returns comprehensive requirement status for every skill on a job posting,
// indicating whether it is test-verified, missing/unverified (with quiz), or auto-verified for now (without quiz).
function getRequirementStatuses(job, studentSkills, skillsWithQuestionsSet = null) {
  if (!job || !job.requirements) return [];
  return job.requirements.map(reqSkill => {
    const canonical = registryCache.resolve(reqSkill.skillName).toLowerCase();
    const isTech = TECHNICAL_SKILLS.has(canonical);
    if (!isTech) {
      return { skillName: reqSkill.skillName, isTech: false, status: 'NON_TECHNICAL' };
    }
    const studentSkillData = studentSkills[canonical];
    const isPresent = Boolean(studentSkillData);
    const verifiedRating = typeof studentSkillData === 'object'
      ? (studentSkillData.verifiedRating || 0)
      : (typeof studentSkillData === 'number' ? studentSkillData : 0);
    const hasQuizInBank = skillsWithQuestionsSet ? skillsWithQuestionsSet.has(canonical) : true;

    if (verifiedRating >= reqSkill.minRating) {
      return {
        skillName: reqSkill.skillName,
        minRating: reqSkill.minRating,
        isTech: true,
        status: 'VERIFIED_BY_TEST',
        verifiedRating,
        hasQuiz: hasQuizInBank
      };
    }

    if (!hasQuizInBank) {
      return {
        skillName: reqSkill.skillName,
        minRating: reqSkill.minRating,
        isTech: true,
        status: 'AUTO_VERIFIED_NO_QUIZ',
        verifiedRating: 0,
        hasQuiz: false
      };
    }

    return {
      skillName: reqSkill.skillName,
      minRating: reqSkill.minRating,
      isTech: true,
      status: isPresent ? 'UNVERIFIED' : 'MISSING_FROM_PROFILE',
      verifiedRating,
      hasQuiz: true
    };
  });
}

module.exports = { buildStudentSkillMap, getMissingRequirements, getRequirementStatuses };
