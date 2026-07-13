// Profile-completeness business rules used to gate locked student tabs.
// Pure functions extracted from StudentLayout so the rule lives in one place
// and the layout no longer mixes this policy into its render body. Logic is
// identical to the previous inline checks.
export function hasGeneralInfo(profile) {
  return !!(
    profile?.name?.trim() &&
    profile?.bio?.trim() &&
    profile?.nationality?.trim() &&
    profile?.gender?.trim() &&
    profile?.email?.trim() &&
    profile?.dob?.trim() &&
    profile?.phone?.trim()
  );
}

export function hasSkills(profile) {
  return !!(profile?.skills && profile.skills.length > 0);
}

export function hasIntroVideo(profile) {
  return !!(profile?.introVideoUrl && profile.introVideoUrl.trim());
}

export function isProfileComplete(profile) {
  return hasGeneralInfo(profile) && hasSkills(profile) && hasIntroVideo(profile);
}
