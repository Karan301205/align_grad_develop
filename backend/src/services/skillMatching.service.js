const { TECHNICAL_SKILLS } = require('../constants/technicalSkills');

// Builds a case-insensitive lookup of a candidate's self-rated skills:
//   { "react": 8, "css": 6, ... }
function buildStudentSkillMap(profile) {
  const studentSkills = {};
  if (profile && profile.skills) {
    profile.skills.forEach(s => {
      studentSkills[s.name.toLowerCase()] = s.rating;
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
      const isTech = TECHNICAL_SKILLS.has(reqSkill.skillName.toLowerCase());
      if (isTech) {
        const studentRating = studentSkills[reqSkill.skillName.toLowerCase()] || 0;
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
