const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses,
  buildRecruiterDemandProfile,
  calculateRecruiterCandidateMatch,
  getTopMatchingTalents
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

  describe('Recruiter Demand Profile & Recommendation Engine', () => {
    const activeJobs = [
      {
        id: 'job_1',
        title: 'Backend Dev 1',
        requirements: [
          { skillName: 'Python', minRating: 5 },
          { skillName: 'SQL', minRating: 3 },
          { skillName: 'Express', minRating: 7 }
        ]
      },
      {
        id: 'job_2',
        title: 'Backend Dev 2',
        requirements: [
          { skillName: 'Python', minRating: 6 },
          { skillName: 'SQL', minRating: 5 }
        ]
      },
      {
        id: 'job_3',
        title: 'Data Analyst',
        requirements: [
          { skillName: 'Python', minRating: 4 }
        ]
      }
    ];

    it('builds Recruiter Demand Profile aggregating ratings and frequencies without treating missing skills as 0', () => {
      const demandProfile = buildRecruiterDemandProfile(activeJobs);

      assert.equal(demandProfile.totalActiveJobs, 3);
      assert.equal(demandProfile.skillList.length, 3);

      // Python: 5, 6, 4 -> average = 5, frequency = 3/3 (100%)
      const python = demandProfile.skills['python'];
      assert.ok(python);
      assert.equal(python.avgRating, 5);
      assert.equal(python.jobCount, 3);
      assert.equal(python.frequencyPercent, 100);

      // SQL: 3, 5 -> average = 4 (NOT (3+5+0)/3 = 2.67), frequency = 2/3 (67%)
      const sql = demandProfile.skills['sql'];
      assert.ok(sql);
      assert.equal(sql.avgRating, 4);
      assert.equal(sql.jobCount, 2);
      assert.equal(sql.frequencyPercent, 67);

      // Express: 7 -> average = 7, frequency = 1/3 (33%)
      const express = demandProfile.skills['express'];
      assert.ok(express);
      assert.equal(express.avgRating, 7);
      assert.equal(express.jobCount, 1);
      assert.equal(express.frequencyPercent, 33);
    });

    it('handles empty active jobs gracefully', () => {
      const demandProfile = buildRecruiterDemandProfile([]);
      assert.equal(demandProfile.totalActiveJobs, 0);
      assert.equal(demandProfile.skillList.length, 0);
    });

    it('calculates candidate match score giving higher weight to frequent skills and penalizing missing skills without excluding', () => {
      const demandProfile = buildRecruiterDemandProfile(activeJobs);

      // Candidate 1: Meets all 3 skills
      const candFull = {
        id: 'cand_1',
        name: 'Full Match',
        skills: [
          { name: 'Python', rating: 5, verifiedRating: 5 },
          { name: 'SQL', rating: 4, verifiedRating: 4 },
          { name: 'Express', rating: 7, verifiedRating: 7 }
        ]
      };

      // Candidate 2: Has Python (100% freq) and SQL (67% freq), missing Express (33% freq)
      const candPartialHighFreq = {
        id: 'cand_2',
        name: 'Partial High Freq',
        skills: [
          { name: 'Python', rating: 5, verifiedRating: 5 },
          { name: 'SQL', rating: 4, verifiedRating: 4 }
        ]
      };

      // Candidate 3: Has only Express (33% freq), missing Python and SQL
      const candPartialLowFreq = {
        id: 'cand_3',
        name: 'Partial Low Freq',
        skills: [
          { name: 'Express', rating: 7, verifiedRating: 7 }
        ]
      };

      // Candidate 4: Unrelated skills (Ruby, Rust, HTML) - should get 0 match
      const candUnrelated = {
        id: 'cand_4',
        name: 'Unrelated',
        skills: [
          { name: 'Ruby', rating: 10, verifiedRating: 10 },
          { name: 'Rust', rating: 10, verifiedRating: 10 }
        ]
      };

      const matchFull = calculateRecruiterCandidateMatch(demandProfile, candFull);
      const matchPartialHigh = calculateRecruiterCandidateMatch(demandProfile, candPartialHighFreq);
      const matchPartialLow = calculateRecruiterCandidateMatch(demandProfile, candPartialLowFreq);
      const matchUnrelated = calculateRecruiterCandidateMatch(demandProfile, candUnrelated);

      assert.equal(matchFull.matchScore, 100);
      assert.equal(matchFull.matchingSkills.length, 3);
      assert.equal(matchFull.missingSkills.length, 0);

      // Candidate 2 has missing Express, but is NOT completely excluded and has positive score
      assert.ok(matchPartialHigh.matchScore > 75, `Expected score > 75, got ${matchPartialHigh.matchScore}`);
      assert.equal(matchPartialHigh.matchingSkills.length, 2);
      assert.equal(matchPartialHigh.missingSkills.length, 1);
      assert.equal(matchPartialHigh.missingSkills[0].name, 'Express');

      // Candidate 2 (high freq skills) must outscore Candidate 3 (low freq skill)
      assert.ok(matchPartialHigh.matchScore > matchPartialLow.matchScore);

      // Candidate 4 has unrelated skills and must get 0 match score
      assert.equal(matchUnrelated.matchScore, 0);
      assert.equal(matchUnrelated.matchingSkills.length, 0);
      assert.equal(matchUnrelated.missingSkills.length, 3);
    });

    it('ensures unrelated candidate skills do not compensate for missing required skills', () => {
      const demandProfile = buildRecruiterDemandProfile(activeJobs);

      // Candidate A: Python 5, missing SQL and Express
      const candA = {
        id: 'cand_a',
        name: 'Cand A',
        skills: [
          { name: 'Python', rating: 5, verifiedRating: 5 }
        ]
      };

      // Candidate B: Python 5 + 10 other unrelated skills with 10/10 rating
      const candB = {
        id: 'cand_b',
        name: 'Cand B',
        skills: [
          { name: 'Python', rating: 5, verifiedRating: 5 },
          { name: 'Java', rating: 10, verifiedRating: 10 },
          { name: 'Kotlin', rating: 10, verifiedRating: 10 },
          { name: 'Figma', rating: 10, verifiedRating: 10 }
        ]
      };

      const matchA = calculateRecruiterCandidateMatch(demandProfile, candA);
      const matchB = calculateRecruiterCandidateMatch(demandProfile, candB);

      assert.equal(matchA.matchScore, matchB.matchScore, 'Unrelated skills must not increase the match score');
    });

    it('dynamically recalculates demand and updates candidate rankings when a new job changes skill averages', () => {
      const initialJobs = [
        {
          id: 'job_1',
          requirements: [{ skillName: 'Python', minRating: 4 }]
        }
      ];

      const candidates = [
        {
          id: 'cand_novice',
          name: 'Novice Python',
          skills: [{ name: 'Python', rating: 4, verifiedRating: 4 }]
        },
        {
          id: 'cand_expert',
          name: 'Expert Python',
          skills: [{ name: 'Python', rating: 9, verifiedRating: 9 }]
        }
      ];

      // When required rating is 4, both candidates meet rating 4
      const result1 = getTopMatchingTalents(initialJobs, candidates);
      assert.equal(result1.topTalents[0].matchScore, 100);
      assert.equal(result1.topTalents[1].matchScore, 100);

      // Now add a senior job requiring Python 10 -> new average is (4 + 10) / 2 = 7
      const updatedJobs = [
        ...initialJobs,
        {
          id: 'job_2',
          requirements: [{ skillName: 'Python', minRating: 10 }]
        }
      ];

      const result2 = getTopMatchingTalents(updatedJobs, candidates);
      assert.equal(result2.demandProfile.skills['python'].avgRating, 7);

      // Expert (rating 9 >= 7) gets 100%, Novice (rating 4 < 7) gets lower similarity
      const expertResult = result2.topTalents.find(c => c.id === 'cand_expert');
      const noviceResult = result2.topTalents.find(c => c.id === 'cand_novice');
      assert.equal(expertResult.matchScore, 100);
      assert.ok(noviceResult.matchScore < expertResult.matchScore);
      assert.equal(result2.topTalents[0].id, 'cand_expert', 'Expert should now rank first');
    });
  });
});
