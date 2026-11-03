/**
 * Pure domain service for calculating project-to-skill alignment and ranking projects
 * according to job-required skills.
 * 
 * Follows Single Responsibility Principle (SRP) and Open/Closed Principle (OCP).
 */

/**
 * Normalizes a skill string for consistent, case-insensitive comparison.
 * @param {string} skill
 * @returns {string}
 */
function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return '';
  return skill.trim().toLowerCase();
}

/**
 * Extracts a normalized Set of skill names from job requirements or skill arrays.
 * Supports:
 *   - [{ skillName: "Python", minRating: 6 }, ...]
 *   - ["Python", "HTML", "CSS"]
 *   - [{ name: "Python" }]
 * @param {Array<object|string>} requirements
 * @returns {Set<string>}
 */
function extractTargetSkillSet(requirements = []) {
  const targetSet = new Set();
  if (!Array.isArray(requirements)) return targetSet;

  for (const req of requirements) {
    if (typeof req === 'string') {
      const norm = normalizeSkill(req);
      if (norm) targetSet.add(norm);
    } else if (req && typeof req === 'object') {
      const rawName = req.skillName || req.name || req.skill;
      if (typeof rawName === 'string') {
        const norm = normalizeSkill(rawName);
        if (norm) targetSet.add(norm);
      }
    }
  }

  return targetSet;
}

/**
 * Calculates match metadata for a single project against target skills.
 * @param {object} project
 * @param {Set<string>} targetSet
 * @returns {object} { matchedSkills: string[], matchCount: number, score: number }
 */
function evaluateProjectRelevance(project, targetSet) {
  if (!project || typeof project !== 'object') {
    return { matchedSkills: [], matchCount: 0, score: 0 };
  }

  const projSkills = Array.isArray(project.skills) ? project.skills : [];
  const matchedSkills = [];
  const matchedSet = new Set();

  for (const s of projSkills) {
    const norm = normalizeSkill(s);
    if (norm && targetSet.has(norm) && !matchedSet.has(norm)) {
      matchedSet.add(norm);
      matchedSkills.push(s); // Preserve original casing for UI display
    }
  }

  const matchCount = matchedSkills.length;
  // Recency indicator
  const isOngoing = Boolean(project.currentlyWorking);
  const score = (matchCount * 100) + (isOngoing ? 5 : 0);

  return {
    matchedSkills,
    matchCount,
    score
  };
}

/**
 * Ranks a list of candidate projects based on job required skills.
 * Projects with matching skills are placed at the top (sorted by match count and recency).
 * Projects with no matching skills follow in chronological/original order.
 * 
 * @param {Array<object>} projects - Candidate's projects
 * @param {Array<object|string>} jobRequirements - Job requirements or skill names
 * @returns {Array<object>} Reordered and enriched projects list
 */
function rankProjectsByRequirements(projects = [], jobRequirements = []) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return [];
  }

  const targetSet = extractTargetSkillSet(jobRequirements);
  if (targetSet.size === 0) {
    // No target requirements provided: return clean copy of projects
    return projects.map(p => ({
      ...p,
      matchedSkills: [],
      matchCount: 0
    }));
  }

  // Score each project
  const evaluated = projects.map((p, originalIndex) => {
    const evalResult = evaluateProjectRelevance(p, targetSet);
    return {
      ...p,
      matchedSkills: evalResult.matchedSkills,
      matchCount: evalResult.matchCount,
      relevanceScore: evalResult.score,
      _originalIndex: originalIndex
    };
  });

  // Sort descending by matchCount, then by recency/ongoing, then preserve original index
  evaluated.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount; // Highest matches first
    }

    // Tie-break 1: Ongoing projects first
    if (a.currentlyWorking !== b.currentlyWorking) {
      return a.currentlyWorking ? -1 : 1;
    }

    // Tie-break 2: Start Date if available
    if (a.startDate && b.startDate) {
      const dateDiff = new Date(b.startDate) - new Date(a.startDate);
      if (!isNaN(dateDiff) && dateDiff !== 0) {
        return dateDiff;
      }
    }

    // Tie-break 3: preserve original order
    return a._originalIndex - b._originalIndex;
  });

  // Mark top matches and clean internal sorting key
  const maxMatches = evaluated[0]?.matchCount || 0;
  return evaluated.map(p => {
    const { _originalIndex, ...rest } = p;
    return {
      ...rest,
      isTopMatch: maxMatches > 0 && p.matchCount === maxMatches
    };
  });
}

module.exports = {
  normalizeSkill,
  extractTargetSkillSet,
  evaluateProjectRelevance,
  rankProjectsByRequirements
};
