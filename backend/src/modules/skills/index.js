const { TECHNICAL_SKILLS } = require('./technicalSkills');
const {
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses,
  isProfileEligible
} = require('./skillMatching.service');

module.exports = {
  TECHNICAL_SKILLS,
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses,
  isProfileEligible
};
