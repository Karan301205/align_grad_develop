/**
 * Builds the standardized JSON resume structure.
 */
function buildJson({
  basicInfo = {},
  education = [],
  experience = [],
  skills = [],
  certifications = [],
  projects = [],
  achievements = [],
  languages = []
}) {
  return {
    basicInfo: {
      name: basicInfo.name || '',
      email: basicInfo.email || '',
      phone: basicInfo.phone || '',
      location: basicInfo.location || '',
      dob: basicInfo.dob || '',
      portfolio: basicInfo.portfolio || '',
      linkedin: basicInfo.linkedin || '',
      github: basicInfo.github || '',
      bio: basicInfo.bio || ''
    },
    education: Array.isArray(education) ? education : [],
    experience: Array.isArray(experience) ? experience : [],
    skills: Array.isArray(skills) ? skills : [],
    certifications: Array.isArray(certifications) ? certifications : [],
    projects: Array.isArray(projects) ? projects : [],
    achievements: Array.isArray(achievements) ? achievements : [],
    languages: Array.isArray(languages) ? languages : []
  };
}

module.exports = {
  buildJson
};
