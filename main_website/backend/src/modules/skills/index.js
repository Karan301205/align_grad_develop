const { TECHNICAL_SKILLS } = require('./technicalSkills');
const {
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses,
  buildRecruiterDemandProfile,
  calculateRecruiterCandidateMatch,
  getTopMatchingTalents
} = require('./skillMatching.service');
const {
  rankProjectsByRequirements,
  evaluateProjectRelevance,
  extractTargetSkillSet,
  normalizeSkill
} = require('./projectRelevance.service');
const {
  calculateSkillAlignment,
  calculatePreferenceMatch,
  calculateContextSignals,
  calculateCandidateJobRecommendation
} = require('./candidateRecommendation.service');

module.exports = {
  TECHNICAL_SKILLS,
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses,
  buildRecruiterDemandProfile,
  calculateRecruiterCandidateMatch,
  getTopMatchingTalents,
  rankProjectsByRequirements,
  evaluateProjectRelevance,
  extractTargetSkillSet,
  normalizeSkill,
  calculateSkillAlignment,
  calculatePreferenceMatch,
  calculateContextSignals,
  calculateCandidateJobRecommendation
};
