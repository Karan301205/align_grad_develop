import { useMemo, useState } from 'react';
import { hasSkillMcq } from '../../../constants';
import { candidateId, compareWithJob, effectiveScore, findSkill, hasEducation, skillName } from './candidateData';

export const SORT_LABELS = {
  recommended: 'Recommended order',
  verified_desc: 'Most verified skills',
  skills_count: 'Most skills',
  name_asc: 'Name (A–Z)',
  newest: 'Newest first'
};
const CREDENTIAL_LABELS = { verified_skills: 'Has verified skills', has_video: 'Has video', has_resume: 'Has resume' };
const EXPERIENCE_LABELS = { experienced: 'Experienced', fresher: 'Freshers' };
const MATCH_LABELS = { 70: 'Match ≥ 70%', 50: 'Match ≥ 50%', any: 'Any match' };

const EMPTY = {
  search: '',
  skills: [], // [{ name, minRating, verifiedOnly }]
  workMode: '',
  workType: '',
  location: '',
  college: '',
  degree: '',
  year: '',
  credential: '',
  experience: '',
  match: '',
  sort: 'recommended',
  onlyMeets: false
};

/** Recommended order from GET /recruiter/top-talents (ranked by the recruiter's demand profile). */
function orderByTalents(candidates, topTalents) {
  if (!Array.isArray(topTalents) || topTalents.length === 0) return candidates;
  const ranks = new Map(topTalents.map((talent, index) => [String(talent.id || talent._id || talent.userId || ''), { index, talent }]));
  return candidates
    .map((cand) => {
      const ranked = ranks.get(String(candidateId(cand)));
      return ranked ? { ...cand, matchScore: ranked.talent.matchScore } : cand;
    })
    .sort((a, b) => (ranks.get(String(candidateId(a)))?.index ?? Infinity) - (ranks.get(String(candidateId(b)))?.index ?? Infinity));
}

function matchesSearch(cand, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const text = [cand.name, cand.username, cand.title || cand.designation, cand.bio, ...(cand.education || []).map((edu) => `${edu?.institute || ''} ${edu?.degree || ''}`)]
    .join(' ')
    .toLowerCase();
  return text.includes(q) || (cand.skills || []).some((skill) => skillName(skill).toLowerCase().includes(q));
}

// Per-skill rating filters only apply to skills that have a test (same rule as before).
function meetsSkillFilter(cand, wanted) {
  const skill = findSkill(cand, wanted.name);
  if (!skill) return false;
  if (!hasSkillMcq(wanted.name)) return true;
  if (wanted.verifiedOnly) return skill.verifiedRating > 0;
  return !(wanted.minRating > 0) || effectiveScore(skill) >= wanted.minRating;
}

/**
 * Search, filters, sort and the active-filter chips for the Candidates page.
 * `comparison` is { job, gatesBySkill } while a job is picked in "Compare with job".
 */
export default function useCandidateFilters({ candidates, topTalents, comparison }) {
  const [f, setF] = useState(EMPTY);
  const set = (key) => (value) => setF((prev) => ({ ...prev, [key]: typeof value === 'function' ? value(prev[key]) : value }));

  const ordered = useMemo(() => orderByTalents(candidates || [], topTalents), [candidates, topTalents]);

  const results = useMemo(() => {
    let list = ordered.filter((cand) => {
      if (!matchesSearch(cand, f.search)) return false;
      if (f.workMode && !(cand.preferredWorkModes || []).includes(f.workMode)) return false;
      if (f.workType && !(cand.preferredWorkTypes || []).includes(f.workType)) return false;
      if (f.location === 'Any Location' && !cand.openToAnyLocation) return false;
      if (f.location && f.location !== 'Any Location' && !(cand.preferredLocations || []).includes(f.location) && !cand.openToAnyLocation) return false;
      if (!f.skills.every((wanted) => meetsSkillFilter(cand, wanted))) return false;
      if ((f.college || f.degree || f.year) && !hasEducation(cand, f)) return false;
      if (f.credential === 'verified_skills' && !(cand.skills || []).some((skill) => skill.verifiedRating > 0)) return false;
      if (f.credential === 'has_video' && !cand.introVideoUrl) return false;
      if (f.credential === 'has_resume' && !cand.resumeUrl) return false;
      const roles = (cand.experience || []).length;
      if (f.experience === 'experienced' && roles === 0) return false;
      if (f.experience === 'fresher' && roles > 0) return false;
      const score = cand.matchScore || 0;
      if ((f.match === '70' && score < 70) || (f.match === '50' && score < 50) || (f.match === 'any' && score <= 0)) return false;
      return true;
    });

    if (comparison?.job) {
      list = list.map((cand) => ({ ...cand, comparison: compareWithJob(cand, comparison.job, comparison.gatesBySkill) }));
      if (f.onlyMeets) list = list.filter((cand) => cand.comparison.meetsAll);
    }

    const verifiedCount = (cand) => (cand.skills || []).filter((skill) => skill.verifiedRating > 0).length;
    if (f.sort === 'verified_desc') list = [...list].sort((a, b) => verifiedCount(b) - verifiedCount(a) || (b.skills?.length || 0) - (a.skills?.length || 0));
    if (f.sort === 'skills_count') list = [...list].sort((a, b) => (b.skills?.length || 0) - (a.skills?.length || 0));
    if (f.sort === 'name_asc') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (f.sort === 'newest') list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [ordered, f, comparison]);

  const chips = [];
  if (f.search.trim()) chips.push({ label: `Search: “${f.search.trim()}”`, clear: () => set('search')('') });
  if (f.workMode) chips.push({ label: `Mode: ${f.workMode}`, clear: () => set('workMode')('') });
  if (f.workType) chips.push({ label: `Type: ${f.workType}`, clear: () => set('workType')('') });
  if (f.location) chips.push({ label: `Location: ${f.location === 'Any Location' ? 'Open to relocate' : f.location}`, clear: () => set('location')('') });
  if (f.year) chips.push({ label: `Graduation: ${f.year}`, clear: () => set('year')('') });
  if (f.college) chips.push({ label: `College: ${f.college}`, clear: () => set('college')('') });
  if (f.degree) chips.push({ label: `Degree: ${f.degree}`, clear: () => set('degree')('') });
  if (f.credential) chips.push({ label: CREDENTIAL_LABELS[f.credential], clear: () => set('credential')('') });
  if (f.experience) chips.push({ label: EXPERIENCE_LABELS[f.experience], clear: () => set('experience')('') });
  if (f.match) chips.push({ label: MATCH_LABELS[f.match], clear: () => set('match')('') });
  if (f.sort !== 'recommended') chips.push({ label: `Sort: ${SORT_LABELS[f.sort]}`, clear: () => set('sort')('recommended') });
  if (comparison?.job && f.onlyMeets) chips.push({ label: 'Meets all bars', clear: () => set('onlyMeets')(false) });

  const isUnfiltered = chips.length === 0 && f.skills.length === 0;

  return {
    filters: f,
    set,
    results,
    chips,
    activeCount: chips.length + f.skills.length,
    advancedCount: [f.credential, f.experience, f.match, f.sort !== 'recommended' ? f.sort : ''].filter(Boolean).length,
    isRecommendedOrder: f.sort === 'recommended' && isUnfiltered && Array.isArray(topTalents) && topTalents.length > 0,
    resetAll: () => setF(EMPTY)
  };
}
