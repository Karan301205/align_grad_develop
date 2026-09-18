// TODO(question-bank Plan 5): TECHNICAL_SKILLS should be derived from the
// SkillDefinition registry rather than a hand-maintained set. Until then,
// registry skills missing from this set (e.g. Redis, GraphQL) will not gate
// applications. Tracked in docs/superpowers/specs/2026-07-18-question-bank-spine-design.md
const { TECHNICAL_SKILLS } = require('./technicalSkills');
const registryCache = require('../assessments/question-bank/skills/registryCache');

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

        const effectiveRating = (verifiedRating && verifiedRating > 0) ? verifiedRating : (selfRating || 0);

        // Check if question bank has MCQs generated for this skill yet
        const hasQuizInBank = skillsWithQuestionsSet ? skillsWithQuestionsSet.has(canonical) : true;

        // If candidate lacks required rating AND the skill has an active quiz in the bank,
        // it gates the application. If the skill has NO quiz in the bank yet, it is auto-verified for now.
        if (effectiveRating < reqSkill.minRating) {
          if (hasQuizInBank) {
            missingRequirements.push({
              skillName: reqSkill.skillName,
              requiredRating: reqSkill.minRating,
              currentRating: effectiveRating,
              selfRating: selfRating,
              isMissingFromProfile: !isPresent,
              isUnverified: isPresent && (!effectiveRating || effectiveRating < reqSkill.minRating),
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
// indicating whether it is test-verified, met by rating, missing/unverified (with quiz), or auto-verified for now (without quiz).
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
    const selfRating = typeof studentSkillData === 'object'
      ? (studentSkillData.rating || 0)
      : verifiedRating;
    const effectiveRating = (verifiedRating && verifiedRating > 0) ? verifiedRating : (selfRating || 0);
    const hasQuizInBank = skillsWithQuestionsSet ? skillsWithQuestionsSet.has(canonical) : true;

    if (effectiveRating >= reqSkill.minRating) {
      return {
        skillName: reqSkill.skillName,
        minRating: reqSkill.minRating,
        isTech: true,
        status: (verifiedRating && verifiedRating >= reqSkill.minRating) ? 'VERIFIED_BY_TEST' : 'MET_BY_RATING',
        verifiedRating: effectiveRating,
        hasQuiz: hasQuizInBank
      };
    }

    if (!hasQuizInBank) {
      return {
        skillName: reqSkill.skillName,
        minRating: reqSkill.minRating,
        isTech: true,
        status: 'AUTO_VERIFIED_NO_QUIZ',
        verifiedRating: effectiveRating,
        hasQuiz: false
      };
    }

    return {
      skillName: reqSkill.skillName,
      minRating: reqSkill.minRating,
      isTech: true,
      status: isPresent ? 'UNVERIFIED' : 'MISSING_FROM_PROFILE',
      verifiedRating: effectiveRating,
      hasQuiz: true
    };
  });
}

// Aggregates required skills and requested ratings across active jobs to build a
// dynamic Recruiter Demand Profile without permanently storing averages.
// Missing skills in a job are NOT treated as 0 (only jobs explicitly requiring that skill are averaged).
// Frequency across active jobs is calculated to give higher importance to frequently requested skills.
function buildRecruiterDemandProfile(activeJobs) {
  const jobsList = Array.isArray(activeJobs) ? activeJobs : [];
  const totalActiveJobs = jobsList.length;

  if (totalActiveJobs === 0) {
    return {
      totalActiveJobs: 0,
      skills: {},
      skillList: []
    };
  }

  const skillAggregates = {};

  jobsList.forEach(job => {
    if (!job || !Array.isArray(job.requirements)) return;

    // Track skills seen within this single job to avoid duplicate counting per job
    const seenInJob = new Set();

    job.requirements.forEach(req => {
      const rawName = (typeof req === 'string' ? req : req.skillName || req.name || '').trim();
      if (!rawName) return;

      const canonicalName = registryCache.resolve(rawName);
      const key = canonicalName.toLowerCase();

      if (seenInJob.has(key)) return;
      seenInJob.add(key);

      const minRating = (typeof req === 'object' && typeof req.minRating === 'number' && req.minRating > 0)
        ? req.minRating
        : ((typeof req === 'object' && typeof req.rating === 'number' && req.rating > 0) ? req.rating : 1);

      if (!skillAggregates[key]) {
        skillAggregates[key] = {
          name: canonicalName,
          key: key,
          ratings: [],
          jobCount: 0
        };
      }

      skillAggregates[key].ratings.push(minRating);
      skillAggregates[key].jobCount += 1;
    });
  });

  const skills = {};
  const skillList = [];

  Object.values(skillAggregates).forEach(item => {
    const count = item.ratings.length;
    const sum = item.ratings.reduce((acc, curr) => acc + curr, 0);
    // Average only across jobs that explicitly require the skill (never treat missing job as 0)
    const rawAvg = count > 0 ? sum / count : 0;
    const avgRating = Math.round(rawAvg * 10) / 10;
    const frequency = totalActiveJobs > 0 ? item.jobCount / totalActiveJobs : 0;
    const frequencyPercent = Math.round(frequency * 100);

    const profileEntry = {
      name: item.name,
      key: item.key,
      avgRating,
      jobCount: item.jobCount,
      frequency,
      frequencyPercent,
      weight: frequency
    };

    skills[item.key] = profileEntry;
    skillList.push(profileEntry);
  });

  // Sort by frequency descending, then avgRating descending
  skillList.sort((a, b) => b.frequency - a.frequency || b.avgRating - a.avgRating);

  return {
    totalActiveJobs,
    skills,
    skillList
  };
}

// Compares a candidate's existing skill ratings against the Recruiter Demand Profile.
// Missing candidate skills reduce skill coverage/similarity score without completely excluding candidate.
// Unrelated candidate skills cannot compensate for missing required skills.
// Overall score factors:
//   - skill-level similarity (sim_k = min(1.0, candRating / reqAvgRating))
//   - required-skill coverage (weighted by skill frequency)
//   - skill frequency/importance weights
function calculateRecruiterCandidateMatch(demandProfile, profile) {
  const studentSkills = buildStudentSkillMap(profile);
  const demandSkills = (demandProfile && Array.isArray(demandProfile.skillList))
    ? demandProfile.skillList
    : [];

  if (demandSkills.length === 0) {
    return {
      candidateId: profile?.id || profile?.userId,
      profile,
      matchScore: 0,
      matchScoreDisplay: '0%',
      skillCoveragePercent: 0,
      matchingSkills: [],
      missingSkills: [],
      matchingSkillsCount: 0,
      totalDemandSkillsCount: 0,
      verifiedMatchesCount: 0
    };
  }

  let totalWeight = 0;
  let weightedSimilaritySum = 0;
  let matchedWeightSum = 0;

  const matchingSkills = [];
  const missingSkills = [];

  demandSkills.forEach(demSkill => {
    const weight = demSkill.weight > 0 ? demSkill.weight : (demSkill.frequency > 0 ? demSkill.frequency : 1);
    totalWeight += weight;

    const candSkillData = studentSkills[demSkill.key];
    const isPresent = Boolean(candSkillData);

    const verifiedRating = typeof candSkillData === 'object'
      ? (candSkillData.verifiedRating || 0)
      : (typeof candSkillData === 'number' ? candSkillData : 0);
    const selfRating = typeof candSkillData === 'object'
      ? (candSkillData.rating || 0)
      : verifiedRating;

    const effectiveRating = (verifiedRating && verifiedRating > 0) ? verifiedRating : (selfRating || 0);

    if (isPresent && effectiveRating > 0) {
      // Skill similarity: ratio of candidate rating to required average rating, capped at 1.0 (100%)
      // Capping at 1.0 ensures that over-qualification in one skill cannot artificially compensate for a missing skill
      const requiredRating = demSkill.avgRating > 0 ? demSkill.avgRating : 1;
      const similarity = Math.min(1.0, effectiveRating / requiredRating);

      weightedSimilaritySum += weight * similarity;
      matchedWeightSum += weight;

      matchingSkills.push({
        name: demSkill.name,
        key: demSkill.key,
        candidateRating: effectiveRating,
        requiredAvgRating: demSkill.avgRating,
        isVerified: Boolean(candSkillData.isVerified || (verifiedRating && verifiedRating > 0)),
        verifiedRating: verifiedRating || null,
        frequencyPercent: demSkill.frequencyPercent,
        meetsOrExceeds: effectiveRating >= demSkill.avgRating,
        similarityPercent: Math.round(similarity * 100)
      });
    } else {
      // Missing skill reduces similarity (similarity = 0) and reduces coverage
      missingSkills.push({
        name: demSkill.name,
        key: demSkill.key,
        requiredAvgRating: demSkill.avgRating,
        frequencyPercent: demSkill.frequencyPercent
      });
    }
  });

  const weightedSimilarity = totalWeight > 0 ? (weightedSimilaritySum / totalWeight) : 0;
  const weightedCoverage = totalWeight > 0 ? (matchedWeightSum / totalWeight) : 0;

  // Combine skill-level similarity (60%) and required-skill coverage (40%)
  const rawScore = (0.6 * weightedSimilarity + 0.4 * weightedCoverage) * 100;
  const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const skillCoveragePercent = Math.min(100, Math.max(0, Math.round(weightedCoverage * 100)));

  const verifiedMatchesCount = matchingSkills.filter(m => m.isVerified).length;

  return {
    candidateId: profile?.id || profile?.userId,
    profile,
    matchScore,
    matchScoreDisplay: `${matchScore}%`,
    skillCoveragePercent,
    matchingSkills,
    missingSkills,
    matchingSkillsCount: matchingSkills.length,
    totalDemandSkillsCount: demandSkills.length,
    verifiedMatchesCount
  };
}

// Derives the Recruiter Demand Profile from active jobs, scores all candidate profiles,
// and returns top-ranked candidates for the Recruiter Dashboard recommendations.
function getTopMatchingTalents(activeJobs, candidateProfiles, limit = 50) {
  const demandProfile = buildRecruiterDemandProfile(activeJobs);
  const profiles = Array.isArray(candidateProfiles) ? candidateProfiles : [];

  if (demandProfile.totalActiveJobs === 0 || demandProfile.skillList.length === 0) {
    return {
      demandProfile,
      topTalents: []
    };
  }

  const scoredCandidates = profiles.map(profile => {
    const match = calculateRecruiterCandidateMatch(demandProfile, profile);
    return {
      ...profile,
      matchScore: match.matchScore,
      matchScoreDisplay: match.matchScoreDisplay,
      skillCoveragePercent: match.skillCoveragePercent,
      matchingSkills: match.matchingSkills,
      missingSkills: match.missingSkills,
      matchingSkillsCount: match.matchingSkillsCount,
      totalDemandSkillsCount: match.totalDemandSkillsCount,
      verifiedMatchesCount: match.verifiedMatchesCount
    };
  });

  // Rank by matchScore desc, then verifiedMatchesCount desc, then matchingSkillsCount desc
  scoredCandidates.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    if (b.verifiedMatchesCount !== a.verifiedMatchesCount) {
      return b.verifiedMatchesCount - a.verifiedMatchesCount;
    }
    if (b.matchingSkillsCount !== a.matchingSkillsCount) {
      return b.matchingSkillsCount - a.matchingSkillsCount;
    }
    return (b.skills?.length || 0) - (a.skills?.length || 0);
  });

  return {
    demandProfile,
    topTalents: typeof limit === 'number' ? scoredCandidates.slice(0, limit) : scoredCandidates
  };
}

module.exports = {
  buildStudentSkillMap,
  getMissingRequirements,
  getRequirementStatuses,
  buildRecruiterDemandProfile,
  calculateRecruiterCandidateMatch,
  getTopMatchingTalents
};
