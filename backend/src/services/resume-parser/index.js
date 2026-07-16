const { normalizeText } = require('./normalizer/normalizer');
const { SECTION_MAPPINGS } = require('./dictionaries/sectionMappings');
const { parseProfile } = require('./parsers/profileParser');
const { parseEducation } = require('./parsers/educationParser');
const { parseExperience } = require('./parsers/experienceParser');
const { parseSkills } = require('./parsers/skillsParser');
const { parseProjects } = require('./parsers/projectsParser');
const { parseCertifications } = require('./parsers/certificationParser');
const { parseAchievements } = require('./parsers/achievementsParser');
const { buildJson } = require('./jsonBuilder/jsonBuilder');

/**
 * Splits normalized text into discrete sections based on keyword mappings.
 * @param {string} text - The normalized resume text
 * @returns {object} - Mapped section texts
 */
function splitSections(text) {
  const lines = text.split('\n');
  const sections = {
    header: '',
    skills: '',
    education: '',
    experience: '',
    projects: '',
    certifications: '',
    achievements: '',
    languages: ''
  };

  let currentSection = 'header';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if the line matches a known section header
    let foundSection = null;
    const cleanLine = trimmed.toLowerCase().replace(/[^a-z0-9\s&]/g, '').trim();

    // Headers are typically short lines (up to 5 words)
    if (cleanLine.split(/\s+/).length <= 5) {
      for (const [sectionKey, keywords] of Object.entries(SECTION_MAPPINGS)) {
        if (keywords.includes(cleanLine)) {
          foundSection = sectionKey;
          break;
        }
      }
    }

    if (foundSection) {
      currentSection = foundSection;
    } else {
      sections[currentSection] += (sections[currentSection] ? '\n' : '') + trimmed;
    }
  }

  return sections;
}

/**
 * Parses raw resume text into a structured JSON resume object.
 * @param {string} rawText - Raw text extracted from the document
 * @returns {object} - Standardized JSON resume
 */
function parseResumeText(rawText) {
  // 1. Normalize the extracted text
  const normalizedText = normalizeText(rawText);

  // 2. Partition text into sections
  const sections = splitSections(normalizedText);

  // 3. Extract items from each section using rule-based parsers
  const basicInfo = parseProfile(normalizedText, sections);
  const education = parseEducation(sections.education);
  const experience = parseExperience(sections.experience);
  const skills = parseSkills(normalizedText, sections);
  const projects = parseProjects(sections.projects);
  const certifications = parseCertifications(sections.certifications);
  const achievements = parseAchievements(sections.achievements);

  // Extract languages spoken separately if possible from languages section
  const languages = sections.languages
    ? sections.languages.split(/[,;\n]+/).map(l => l.trim()).filter(l => l.length > 2)
    : [];

  // 4. Assemble the standardized JSON
  return buildJson({
    basicInfo,
    education,
    experience,
    skills,
    certifications,
    projects,
    achievements,
    languages
  });
}

module.exports = {
  parseResumeText
};
