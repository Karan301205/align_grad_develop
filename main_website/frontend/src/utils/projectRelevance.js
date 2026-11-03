/**
 * Client-side utility for computing project-to-skill alignment and ranking projects
 * according to job-required skills or recruiter active skill filters.
 */

/**
 * Normalizes a skill string for consistent, case-insensitive comparison.
 * @param {string} skill
 * @returns {string}
 */
export function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return '';
  return skill.trim().toLowerCase();
}

/**
 * Extracts a normalized Set of skill names from job requirements, filter arrays, or skill objects.
 * Supports:
 *   - [{ skillName: "Python", minRating: 6 }, ...]
 *   - ["Python", "HTML", "CSS"]
 *   - [{ name: "Python" }]
 * @param {Array<object|string>} requirements
 * @returns {Set<string>}
 */
export function extractTargetSkillSet(requirements = []) {
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
 * Evaluates matching skills on a single project against target skills.
 * @param {object} project
 * @param {Set<string>} targetSet
 * @returns {object} { matchedSkills: string[], matchCount: number }
 */
export function evaluateProjectRelevance(project, targetSet) {
  if (!project || typeof project !== 'object') {
    return { matchedSkills: [], matchCount: 0 };
  }

  const projSkills = Array.isArray(project.skills) ? project.skills : [];
  const matchedSkills = [];
  const matchedSet = new Set();

  for (const s of projSkills) {
    const norm = normalizeSkill(s);
    if (norm && targetSet.has(norm) && !matchedSet.has(norm)) {
      matchedSet.add(norm);
      matchedSkills.push(s); // Preserve original casing for UI
    }
  }

  return {
    matchedSkills,
    matchCount: matchedSkills.length
  };
}

/**
 * Ranks candidate projects by job requirements or active skill filters.
 * Returns both the ordered projects list and summary statistics.
 * 
 * @param {Array<object>} projects - Candidate's projects
 * @param {Array<object|string>} jobRequirements - Job requirements or skill names
 * @returns {{ rankedProjects: Array<object>, matchedProjectsCount: number, maxMatches: number, targetSkillsCount: number }}
 */
export function rankProjectsForJob(projects = [], jobRequirements = []) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return {
      rankedProjects: [],
      matchedProjectsCount: 0,
      maxMatches: 0,
      targetSkillsCount: 0
    };
  }

  const targetSet = extractTargetSkillSet(jobRequirements);
  if (targetSet.size === 0) {
    return {
      rankedProjects: projects.map(p => ({
        ...p,
        matchedSkills: [],
        matchCount: 0,
        isTopMatch: false
      })),
      matchedProjectsCount: 0,
      maxMatches: 0,
      targetSkillsCount: 0
    };
  }

  const evaluated = projects.map((p, originalIndex) => {
    const { matchedSkills, matchCount } = evaluateProjectRelevance(p, targetSet);
    return {
      ...p,
      matchedSkills,
      matchCount,
      _originalIndex: originalIndex
    };
  });

  // Sort descending by matchCount, then by recency/ongoing, then preserve original order
  evaluated.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }

    if (a.currentlyWorking !== b.currentlyWorking) {
      return a.currentlyWorking ? -1 : 1;
    }

    if (a.startDate && b.startDate) {
      const dateDiff = new Date(b.startDate) - new Date(a.startDate);
      if (!isNaN(dateDiff) && dateDiff !== 0) {
        return dateDiff;
      }
    }

    return a._originalIndex - b._originalIndex;
  });

  const maxMatches = evaluated[0]?.matchCount || 0;
  const matchedProjectsCount = evaluated.filter(p => p.matchCount > 0).length;

  const rankedProjects = evaluated.map(p => {
    const { _originalIndex, ...rest } = p;
    return {
      ...rest,
      isTopMatch: maxMatches > 0 && p.matchCount === maxMatches
    };
  });

  return {
    rankedProjects,
    matchedProjectsCount,
    maxMatches,
    targetSkillsCount: targetSet.size
  };
}
