const { buildStudentSkillMap } = require('./skillMatching.service');
const registryCache = require('../assessments/question-bank/skills/registryCache');

/**
 * Candidate-Side Job Recommendation Service
 * 
 * Implements a 3-Layer scoring architecture:
 * 1. Skill Alignment Score (50% weight):
 *    - Fuzzy/canonical skill matching via registryCache
 *    - Similarity ratio: min(1.0, candidateRating / requiredRating)
 *    - 1.15x bonus for verified skills (MCQ passed)
 *    - Required skill coverage penalty for missing skills
 * 
 * 2. Preference Match Score (30% weight):
 *    - Work Mode (preferredWorkModes vs job.workMode)
 *    - Opportunity/Work Type (preferredWorkTypes vs job.opportunityType)
 *    - Location Match (preferredLocations / openToAnyLocation vs job.location)
 *    - Experience Fit (profile experience vs job.desiredExperience)
 *    - Salary/Stipend Alignment (presence/ranges)
 * 
 * 3. Behavioral & Context Signals (20% weight):
 *    - Job Recency decay (exponential decay by days elapsed)
 *    - Project Skill Overlap (profile.projects[].skills vs job requirements)
 *    - Prior application patterns (same company / stack history)
 */

/**
 * Normalizes text for lenient comparison.
 */
function normalizeText(str) {
  return String(str || '').trim().toLowerCase();
}

/**
 * Layer 1: Calculates the Skill Alignment Score between candidate and job.
 * Returns: { skillScore: 0-100, matchingSkills: [], missingSkills: [] }
 */
function calculateSkillAlignment(job, studentSkills) {
  const requirements = Array.isArray(job?.requirements) ? job.requirements : [];

  // If job has no technical requirements, return neutral high score
  if (requirements.length === 0) {
    return {
      skillScore: 75,
      matchingSkills: [],
      missingSkills: [],
      coveragePercent: 100
    };
  }

  let totalWeight = 0;
  let weightedSimilaritySum = 0;
  let matchedWeightSum = 0;
  const matchingSkills = [];
  const missingSkills = [];

  requirements.forEach(req => {
    const rawName = (typeof req === 'string' ? req : req.skillName || req.name || '').trim();
    if (!rawName) return;

    const canonicalName = registryCache.resolve(rawName);
    const key = canonicalName.toLowerCase();
    const minRating = (typeof req === 'object' && typeof req.minRating === 'number' && req.minRating > 0)
      ? req.minRating
      : ((typeof req === 'object' && typeof req.rating === 'number' && req.rating > 0) ? req.rating : 1);

    const weight = (typeof req === 'object' && typeof req.weight === 'number' && req.weight > 0)
      ? req.weight
      : 1.0;

    totalWeight += weight;

    const candSkill = studentSkills[key];
    const isPresent = Boolean(candSkill);

    const verifiedRating = typeof candSkill === 'object'
      ? (candSkill.verifiedRating || 0)
      : (typeof candSkill === 'number' ? candSkill : 0);
    const selfRating = typeof candSkill === 'object'
      ? (candSkill.rating || 0)
      : verifiedRating;

    const effectiveRating = (verifiedRating && verifiedRating > 0) ? verifiedRating : (selfRating || 0);

    if (isPresent && effectiveRating > 0) {
      // Base similarity ratio capped at 1.0
      let similarity = Math.min(1.0, effectiveRating / minRating);

      // 1.15x verification multiplier for MCQ test-verified skills
      const isVerified = Boolean(candSkill.isVerified || (verifiedRating && verifiedRating >= minRating));
      if (isVerified) {
        similarity = Math.min(1.0, similarity * 1.15);
      }

      weightedSimilaritySum += weight * similarity;
      matchedWeightSum += weight;

      matchingSkills.push({
        name: canonicalName,
        key,
        candidateRating: effectiveRating,
        requiredRating: minRating,
        isVerified,
        similarityPercent: Math.round(similarity * 100)
      });
    } else {
      missingSkills.push({
        name: canonicalName,
        key,
        requiredRating: minRating
      });
    }
  });

  const weightedSimilarity = totalWeight > 0 ? (weightedSimilaritySum / totalWeight) : 0;
  const weightedCoverage = totalWeight > 0 ? (matchedWeightSum / totalWeight) : 0;

  // 60% similarity + 40% coverage
  const rawScore = (0.6 * weightedSimilarity + 0.4 * weightedCoverage) * 100;
  const skillScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const coveragePercent = Math.min(100, Math.max(0, Math.round(weightedCoverage * 100)));

  return {
    skillScore,
    matchingSkills,
    missingSkills,
    coveragePercent
  };
}

/**
 * Layer 2: Calculates the Preference Match Score.
 * Returns: preferenceScore (0-100)
 */
function calculatePreferenceMatch(job, profile) {
  if (!profile) return 70; // Neutral default if profile is empty

  let totalFactorWeight = 0;
  let weightedScoreSum = 0;

  // 1. Work Mode Match (Weight: 0.25)
  const modeWeight = 0.25;
  totalFactorWeight += modeWeight;
  const preferredModes = Array.isArray(profile.preferredWorkModes)
    ? profile.preferredWorkModes.map(normalizeText)
    : [];
  const jobMode = normalizeText(job?.workMode || '');

  if (preferredModes.length === 0) {
    // Candidate hasn't set preference -> neutral 1.0
    weightedScoreSum += modeWeight * 1.0;
  } else if (jobMode.includes('remote') || jobMode.includes('home') || jobMode === 'wfh') {
    // Remote is universally compatible
    weightedScoreSum += modeWeight * 1.0;
  } else if (preferredModes.some(m => jobMode.includes(m) || m.includes(jobMode))) {
    // Exact or partial match
    weightedScoreSum += modeWeight * 1.0;
  } else if (preferredModes.includes('hybrid') && jobMode.includes('office')) {
    weightedScoreSum += modeWeight * 0.5;
  } else {
    weightedScoreSum += modeWeight * 0.3;
  }

  // 2. Opportunity / Work Type Match (Weight: 0.25)
  const typeWeight = 0.25;
  totalFactorWeight += typeWeight;
  const preferredTypes = Array.isArray(profile.preferredWorkTypes)
    ? profile.preferredWorkTypes.map(normalizeText)
    : [];
  const jobType = normalizeText(job?.opportunityType || 'job');

  if (preferredTypes.length === 0) {
    weightedScoreSum += typeWeight * 1.0;
  } else {
    const isInternMatch = preferredTypes.some(t => t.includes('intern')) && jobType.includes('intern');
    const isJobMatch = preferredTypes.some(t => t.includes('full') || t.includes('job')) && (jobType.includes('job') || !jobType.includes('intern'));
    if (isInternMatch || isJobMatch) {
      weightedScoreSum += typeWeight * 1.0;
    } else {
      weightedScoreSum += typeWeight * 0.4;
    }
  }

  // 3. Location Match (Weight: 0.25)
  const locWeight = 0.25;
  totalFactorWeight += locWeight;
  const openToAny = Boolean(profile.openToAnyLocation);
  const preferredLocs = Array.isArray(profile.preferredLocations)
    ? profile.preferredLocations.map(normalizeText)
    : [];
  const jobLoc = normalizeText(job?.location || '');

  if (openToAny || preferredLocs.length === 0 || jobMode.includes('remote') || jobLoc.includes('home') || jobLoc.includes('remote')) {
    weightedScoreSum += locWeight * 1.0;
  } else if (preferredLocs.some(loc => jobLoc.includes(loc) || loc.includes(jobLoc))) {
    weightedScoreSum += locWeight * 1.0;
  } else {
    weightedScoreSum += locWeight * 0.35;
  }

  // 4. Experience Fit (Weight: 0.15)
  const expWeight = 0.15;
  totalFactorWeight += expWeight;
  const experienceItems = Array.isArray(profile.experience) ? profile.experience : [];
  const hasExperience = experienceItems.length > 0;
  const jobDesiredExp = normalizeText(job?.desiredExperience || '');

  if (!jobDesiredExp || jobDesiredExp.includes('any') || jobDesiredExp.includes('fresher')) {
    weightedScoreSum += expWeight * 1.0;
  } else if (hasExperience) {
    weightedScoreSum += expWeight * 0.95;
  } else {
    weightedScoreSum += expWeight * 0.65;
  }

  // 5. Compensation Signal (Weight: 0.10)
  const compWeight = 0.10;
  totalFactorWeight += compWeight;
  const hasStipend = Boolean(job?.stipendFullTime || job?.stipendPartTime || job?.salary || job?.stipend);
  if (hasStipend || job?.showSalary !== false) {
    weightedScoreSum += compWeight * 1.0;
  } else {
    weightedScoreSum += compWeight * 0.8;
  }

  const rawPref = totalFactorWeight > 0 ? (weightedScoreSum / totalFactorWeight) * 100 : 70;
  return Math.min(100, Math.max(0, Math.round(rawPref)));
}

/**
 * Layer 3: Calculates Behavioral & Contextual Signals.
 * Returns: contextScore (0-100)
 */
function calculateContextSignals(job, profile, applications = []) {
  let contextScoreSum = 0;

  // 1. Job Recency Decay (40% of context)
  // Half-life of ~23 days: e^(-0.03 * daysElapsed)
  const createdAt = job?.createdAt ? new Date(job.createdAt).getTime() : Date.now();
  const daysElapsed = Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60 * 24));
  const recencyMultiplier = Math.exp(-0.03 * daysElapsed); // between 0.3 and 1.0
  const recencyScore = Math.max(30, Math.round(recencyMultiplier * 100));
  contextScoreSum += 0.40 * recencyScore;

  // 2. Project Skill Overlap (40% of context)
  // If student built projects tagged with the job's required skills, boost score
  const projects = Array.isArray(profile?.projects) ? profile.projects : [];
  const candidateProjectSkills = new Set();
  projects.forEach(p => {
    if (Array.isArray(p.skills)) {
      p.skills.forEach(s => {
        const canonical = registryCache.resolve(s).toLowerCase();
        candidateProjectSkills.add(canonical);
      });
    }
  });

  const jobReqs = Array.isArray(job?.requirements) ? job.requirements : [];
  let matchedProjectSkillsCount = 0;
  jobReqs.forEach(req => {
    const rawName = (typeof req === 'string' ? req : req.skillName || req.name || '').trim();
    const canonical = registryCache.resolve(rawName).toLowerCase();
    if (candidateProjectSkills.has(canonical)) {
      matchedProjectSkillsCount += 1;
    }
  });

  let projectOverlapScore = 60; // neutral base
  if (jobReqs.length > 0) {
    const ratio = matchedProjectSkillsCount / jobReqs.length;
    projectOverlapScore = Math.round(60 + ratio * 40); // 60 to 100
  } else if (candidateProjectSkills.size > 0) {
    projectOverlapScore = 80;
  }
  contextScoreSum += 0.40 * projectOverlapScore;

  // 3. Prior Application & Company Familiarity (20% of context)
  const isApplied = applications.some(app => app.jobId === job?.id);
  let familiarityScore = 70; // baseline
  if (isApplied) {
    familiarityScore = 50; // deprioritize already applied
  } else {
    const appliedSameCompany = applications.some(app => app.job?.companyId === job?.companyId);
    if (appliedSameCompany) {
      familiarityScore = 90;
    }
  }
  contextScoreSum += 0.20 * familiarityScore;

  return Math.min(100, Math.max(0, Math.round(contextScoreSum)));
}

/**
 * Computes the complete 3-layer recommendation for a single job and candidate.
 */
function calculateCandidateJobRecommendation(job, profile, studentSkills, applications = []) {
  const { skillScore, matchingSkills, missingSkills, coveragePercent } = calculateSkillAlignment(job, studentSkills);
  const preferenceScore = calculatePreferenceMatch(job, profile);
  const contextScore = calculateContextSignals(job, profile, applications);

  // 3-Layer Composite Formula: 50% Skills + 30% Preferences + 20% Context
  const compositeScore = Math.round(
    0.50 * skillScore +
    0.30 * preferenceScore +
    0.20 * contextScore
  );

  const recommendationScore = Math.min(100, Math.max(0, compositeScore));

  let matchLabel = 'Good Match';
  if (recommendationScore >= 85) {
    matchLabel = 'Excellent Match';
  } else if (recommendationScore >= 70) {
    matchLabel = 'Strong Match';
  } else if (recommendationScore >= 50) {
    matchLabel = 'Good Match';
  } else {
    matchLabel = 'Fair Match';
  }

  return {
    recommendationScore,
    matchLabel,
    matchBreakdown: {
      skillScore,
      preferenceScore,
      contextScore,
      coveragePercent,
      matchingSkillsCount: matchingSkills.length,
      totalRequiredSkillsCount: (job.requirements || []).length,
      matchingSkills,
      missingSkills
    }
  };
}

module.exports = {
  calculateSkillAlignment,
  calculatePreferenceMatch,
  calculateContextSignals,
  calculateCandidateJobRecommendation
};

