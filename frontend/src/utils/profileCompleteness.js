// Profile-completeness business rules used to gate locked student tabs.
// Pure functions extracted from StudentLayout so the rule lives in one place
// and the layout no longer mixes this policy into its render body. Logic is
// identical to the previous inline checks.
export function hasGeneralInfo(profile) {
  return !!(
    profile?.name?.trim() &&
    profile?.username?.trim() &&
    profile?.bio?.trim() &&
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
  return hasGeneralInfo(profile) && hasIntroVideo(profile);
}

export function isCompanyProfileComplete(company) {
  if (!company) return false;

  const hasBasicFields = Boolean(
    company.name?.trim() &&
    company.industry?.trim() &&
    company.companySize?.trim() &&
    company.location?.trim() &&
    company.website?.trim() &&
    company.description?.trim() &&
    company.recruiterName?.trim() &&
    company.recruiterDesignation?.trim() &&
    company.officialEmail?.trim()
  );

  const hasVerification = Boolean(
    company.verified ||
    (Array.isArray(company.verificationDocs) && company.verificationDocs.length >= 2) ||
    company.docUrl
  );

  return hasBasicFields && hasVerification;
}


/**
 * Calculates a single overall profile completeness percentage (0 to 100%)
 * and identifies missing items dynamically based on all profile sections and fields.
 */
export function getProfileCompletionDetails(data = {}) {
  if (!data) return { percentage: 0, missingItems: [] };

  let score = 0;
  const missingItems = [];

  // Basic Info (10 fields * 3.5% = 35%)
  const name = data.name || data.profile?.name;
  if (name && String(name).trim().length > 0) score += 3.5;
  else missingItems.push('Full Name');

  const username = data.username !== undefined ? data.username : data.profile?.username;
  if (username && String(username).trim().length > 0) score += 3.5;
  else missingItems.push('Username');

  const bio = data.bio !== undefined ? data.bio : data.profile?.bio;
  if (bio && String(bio).trim().length > 0) score += 3.5;
  else missingItems.push('Describe Yourself');

  const email = data.email || data.profileEmail || data.profile?.email;
  if (email && String(email).trim().length > 0) score += 3.5;
  else missingItems.push('Email');

  const phone = data.phone || data.localPhone || data.profile?.phone;
  if (phone && String(phone).trim().length > 0) score += 3.5;
  else missingItems.push('Phone Number');

  const dob = data.dob || data.profile?.dob;
  if (dob && String(dob).trim().length > 0) score += 3.5;
  else missingItems.push('Date of Birth');

  const gender = data.gender || data.profile?.gender;
  if (gender && String(gender).trim().length > 0) score += 3.5;
  else missingItems.push('Gender');

  const resumeUrl = data.resumeUrl || data.profile?.resumeUrl;
  if (resumeUrl && String(resumeUrl).trim().length > 0) score += 3.5;
  else missingItems.push('Resume URL');

  const linkedin = data.linkedin || data.socialLinks?.linkedin;
  if (linkedin && String(linkedin).trim().length > 0) score += 3.5;
  else missingItems.push('LinkedIn Link');

  const portfolio = data.portfolio || data.socialLinks?.portfolio;
  if (portfolio && String(portfolio).trim().length > 0) score += 3.5;
  else missingItems.push('Portfolio Link');

  // Profile Photo: 5%
  const photo = data.profilePic || data.profile?.profilePic;
  if (photo && String(photo).trim().length > 0) score += 5;
  else missingItems.push('Profile Photo');

  // Work Preferences: 5%
  const workModes = data.preferredWorkModes || data.profile?.preferredWorkModes;
  const workTypes = data.preferredWorkTypes || data.profile?.preferredWorkTypes;
  const locations = data.preferredLocations || data.profile?.preferredLocations;
  if ((workModes && workModes.length > 0) || (workTypes && workTypes.length > 0) || (locations && locations.length > 0)) {
    score += 5;
  } else {
    missingItems.push('Work Preferences');
  }

  // Skills: 15%
  const skills = data.skills || data.skillsList || data.profile?.skills;
  if (skills && skills.length > 0) score += 15;
  else missingItems.push('Skills');

  // Education: 10%
  const education = data.education || data.educationList || data.profile?.education;
  if (education && education.length > 0) score += 10;
  else missingItems.push('Education');

  // Experience: 10%
  const experience = data.experience || data.experienceList || data.profile?.experience;
  if (experience && experience.length > 0) score += 10;
  else missingItems.push('Experience');

  // Projects: 10%
  const projects = data.projects || data.projectsList || data.profile?.projects;
  if (projects && projects.length > 0) score += 10;
  else missingItems.push('Projects');

  // Certificates: 5%
  const certificates = data.certificates || data.certificatesList || data.profile?.certificates;
  if (certificates && certificates.length > 0) score += 5;
  else missingItems.push('Certifications');

  // Intro Video: 5%
  const introVideo = data.introVideoUrl || data.profile?.introVideoUrl;
  if (introVideo && String(introVideo).trim().length > 0) score += 5;
  else missingItems.push('Introduction Video');

  const percentage = Math.min(100, Math.round(score));
  return { percentage, missingItems };
}

export function calculateOverallProfileCompleteness(data = {}) {
  return getProfileCompletionDetails(data).percentage;
}
