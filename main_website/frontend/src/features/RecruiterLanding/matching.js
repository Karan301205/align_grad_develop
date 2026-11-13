import {
  DEMO_POOL, DEMO_SKILLS, DEMO_AVATAR_COLORS, DEMO_MATCH_MIN, DEMO_SHOWN
} from './content';

const RING_CIRCUMFERENCE = 314;

/**
 * Scores the sample pool against the chosen skills and minimum levels, exactly
 * as the design's demo does. Per skill: 75% weight on how much of the bar the
 * score covers (capped at 100%) plus 25% on the raw score; the match is the
 * average across the chosen skills.
 *
 * Returns { aboveCount, top, average } where `top` is the best DEMO_SHOWN
 * candidates at or above DEMO_MATCH_MIN, best first (ties keep pool order).
 */
export function rankCandidates(selectedSkills, levels) {
  const scored = DEMO_POOL.map(([name, scores], index) => {
    const parts = selectedSkills.map((skill) => {
      const score = scores[DEMO_SKILLS.indexOf(skill)];
      const required = levels[skill] * 10;
      return {
        skill,
        score,
        met: score >= required,
        weight: Math.min(score / required, 1) * 0.75 + (score / 100) * 0.25
      };
    });
    const match = Math.round((parts.reduce((sum, part) => sum + part.weight, 0) / parts.length) * 100);
    return {
      name,
      initials: name.split(' ').map((word) => word[0]).join(''),
      color: DEMO_AVATAR_COLORS[index % DEMO_AVATAR_COLORS.length],
      match,
      ringOffset: (RING_CIRCUMFERENCE * (1 - match / 100)).toFixed(1),
      barsMet: parts.filter((part) => part.met).length,
      parts
    };
  });

  const above = scored.filter((candidate) => candidate.match >= DEMO_MATCH_MIN).sort((a, b) => b.match - a.match);
  const top = above.slice(0, DEMO_SHOWN);
  const average = top.length ? Math.round(top.reduce((sum, candidate) => sum + candidate.match, 0) / top.length) : 0;
  return { aboveCount: above.length, top, average };
}
