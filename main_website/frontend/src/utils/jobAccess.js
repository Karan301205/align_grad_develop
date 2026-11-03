// Candidate job-access rules shared by the Opportunities grid, the Candidate
// Dashboard and the job brief page, so the free-plan limit and the default
// ordering stay identical everywhere.

// Free-plan candidates can open the top N jobs of a list; the rest sit behind
// the Student Pro (STUDENT_LIFETIME) paywall.
export const FREE_PLAN_JOB_LIMIT = 3;
// The gigs marketplace leaves its top 5 gigs unlocked for free-plan candidates.
export const FREE_PLAN_GIG_LIMIT = 5;

export function isPremiumCandidate(profile, user) {
  return profile?.plan ? profile.plan === 'PREMIUM' : user?.plan === 'PREMIUM';
}

// Default Opportunities order: best recommendation match first, newest first on ties.
export function compareByRecommendation(a, b) {
  const diff = (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0);
  if (diff !== 0) return diff;
  return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
}

// Previous/Next state for the job brief (and, with freeLimit = FREE_PLAN_GIG_LIMIT, the gig detail page).
// - sequenceIds: order of the list the brief was opened from; when missing or not
//   containing the open job (e.g. a direct /job_brief link), the default
//   Opportunities order is used.
// - Free-plan candidates are capped to the first FREE_PLAN_JOB_LIMIT jobs of that
//   list, i.e. the same jobs the Opportunities grid leaves unlocked for them.
// Returns null when there is nothing to step through or the open job is outside
// the allowed set (e.g. a free candidate on a shared link to a locked job).
export function getBriefNavigation({ selectedJobId, sequenceIds, jobs, isPremium, freeLimit = FREE_PLAN_JOB_LIMIT }) {
  if (!selectedJobId || !Array.isArray(jobs)) return null;
  const liveIds = new Set(jobs.map(j => j.id));
  let sequence = (sequenceIds || []).filter(id => liveIds.has(id));
  if (!sequence.includes(selectedJobId)) {
    sequence = [...jobs].sort(compareByRecommendation).map(j => j.id);
  }
  const totalInList = sequence.length;
  if (!isPremium) {
    sequence = sequence.slice(0, freeLimit);
  }
  const index = sequence.indexOf(selectedJobId);
  if (index === -1 || totalInList < 2) return null;
  const nextId = index < sequence.length - 1 ? sequence[index + 1] : null;
  return {
    position: index + 1,
    total: sequence.length,
    prevId: index > 0 ? sequence[index - 1] : null,
    nextId,
    // At the end of the free set while the list has more jobs.
    freeLimitReached: !isPremium && !nextId && totalInList > sequence.length,
    totalInList,
    freeLimit
  };
}
