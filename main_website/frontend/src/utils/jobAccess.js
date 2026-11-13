// Candidate job-access rules shared by the Jobs, Gigs and Home pages, so the
// free-plan limits and the default ordering stay identical everywhere.

// Free-plan candidates can open the top N jobs of a list; the rest sit behind
// the Student Pro (STUDENT_LIFETIME) paywall.
export const FREE_PLAN_JOB_LIMIT = 3;
// The Gigs page leaves the top 5 gigs of each list open to free-plan candidates.
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
