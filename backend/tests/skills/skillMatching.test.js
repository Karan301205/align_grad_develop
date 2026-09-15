const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses
} = require('../../src/modules/skills/skillMatching.service');

describe('skillMatching.service', () => {
  const mockJob = {
    requirements: [
      { skillName: 'Python', minRating: 1 },
      { skillName: 'CSS', minRating: 2 }
    ]
  };

  it('allows applying when candidate meets requirements via profile self-rating', () => {
    const profile = {
      skills: [
        { name: 'Python', rating: 3, verifiedRating: null },
        { name: 'CSS', rating: 5, verifiedRating: 0 }
      ]
    };
    const studentSkills = buildStudentSkillMap(profile);
    const missing = getMissingRequirements(mockJob, studentSkills);

    assert.equal(missing.length, 0, 'Candidate meeting thresholds should have 0 missing requirements');

    const statuses = getRequirementStatuses(mockJob, studentSkills);
    assert.equal(statuses.length, 2);
    assert.equal(statuses[0].status, 'MET_BY_RATING');
    assert.equal(statuses[0].verifiedRating, 3);
    assert.equal(statuses[1].status, 'MET_BY_RATING');
    assert.equal(statuses[1].verifiedRating, 5);
  });

  it('flags test-verified when candidate passed verification test', () => {
    const profile = {
      skills: [
        { name: 'Python', rating: 3, verifiedRating: 4 },
        { name: 'CSS', rating: 2, verifiedRating: 3 }
      ]
    };
    const studentSkills = buildStudentSkillMap(profile);
    const missing = getMissingRequirements(mockJob, studentSkills);

    assert.equal(missing.length, 0);
    const statuses = getRequirementStatuses(mockJob, studentSkills);
    assert.equal(statuses[0].status, 'VERIFIED_BY_TEST');
    assert.equal(statuses[0].verifiedRating, 4);
    assert.equal(statuses[1].status, 'VERIFIED_BY_TEST');
    assert.equal(statuses[1].verifiedRating, 3);
  });

  it('correctly catches missing requirements when rating is below required threshold', () => {
    const profile = {
      skills: [
        { name: 'Python', rating: 1, verifiedRating: null },
        { name: 'CSS', rating: 1, verifiedRating: null } // requires 2
      ]
    };
    const studentSkills = buildStudentSkillMap(profile);
    const missing = getMissingRequirements(mockJob, studentSkills);

    assert.equal(missing.length, 1);
    assert.equal(missing[0].skillName, 'CSS');
    assert.equal(missing[0].requiredRating, 2);
    assert.equal(missing[0].currentRating, 1);
  });

  it('flags missing from profile when candidate does not possess the skill', () => {
    const profile = {
      skills: [
        { name: 'Python', rating: 2 }
      ]
    };
    const studentSkills = buildStudentSkillMap(profile);
    const missing = getMissingRequirements(mockJob, studentSkills);

    assert.equal(missing.length, 1);
    assert.equal(missing[0].skillName, 'CSS');
    assert.equal(missing[0].isMissingFromProfile, true);
  });
});
