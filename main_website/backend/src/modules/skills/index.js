const { TECHNICAL_SKILLS } = require('./technicalSkills');
const {
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses,
  buildRecruiterDemandProfile,
  calculateRecruiterCandidateMatch,
  getTopMatchingTalents
} = require('./skillMatching.service');

module.exports = {
  TECHNICAL_SKILLS,
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses,
  buildRecruiterDemandProfile,
  calculateRecruiterCandidateMatch,
  getTopMatchingTalents
};
