import { useMemo, useState } from 'react';

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

/**
 * Search, filters, sort and the active-filter chips for the Candidates page. The filtering
 * itself runs on the server: `request` is the body for POST /recruiter/candidates/search
 * (without `page`), and `compareJobId` adds a job's bars to every card.
 */
export default function useCandidateFilters({ compareJobId = '' } = {}) {
  const [f, setF] = useState(EMPTY);
  const set = (key) => (value) => setF((prev) => ({ ...prev, [key]: typeof value === 'function' ? value(prev[key]) : value }));

  const request = useMemo(
    () => ({
      ...f,
      q: f.search.trim(),
      search: undefined,
      skills: f.skills.map(({ name, minRating, verifiedOnly }) => ({ name, minRating: Number(minRating) || 0, verifiedOnly: Boolean(verifiedOnly) })),
      onlyMeets: Boolean(compareJobId) && f.onlyMeets,
      compareJobId
    }),
    [f, compareJobId]
  );

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
  if (compareJobId && f.onlyMeets) chips.push({ label: 'Meets all bars', clear: () => set('onlyMeets')(false) });

  const isUnfiltered = chips.length === 0 && f.skills.length === 0;

  return {
    filters: f,
    set,
    request,
    chips,
    isUnfiltered,
    activeCount: chips.length + f.skills.length,
    advancedCount: [f.credential, f.experience, f.match, f.sort !== 'recommended' ? f.sort : ''].filter(Boolean).length,
    resetAll: () => setF(EMPTY)
  };
}
