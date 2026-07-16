const { SKILLS_DICTIONARY } = require('../dictionaries/skills');

/**
 * Extracts and normalizes skills from the resume text using dictionary matching.
 * @param {string} text - The full normalized resume text
 * @param {object} sections - The text split by sections
 * @returns {Array<object>} - Array of skill objects: { name, rating: 1 }
 */
function parseSkills(text, sections) {
  const extractedSkills = new Set();

  // Search in full text (and double weigh skills section)
  const skillsText = (sections.skills || '') + '\n' + text;

  for (const [skillName, aliases] of Object.entries(SKILLS_DICTIONARY)) {
    for (const alias of aliases) {
      let hasMatch = false;

      // Handle word boundary checks dynamically
      if (alias.startsWith('\\b') || alias.endsWith('\\b')) {
        const regex = new RegExp(alias, 'i');
        hasMatch = regex.test(skillsText);
      } else {
        // Escape special regex characters in alias (e.g. C++, .NET)
        const escaped = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        
        // Ensure the alias stands alone as a word/token
        // Matches if preceded/succeeded by space, boundary, or punctuation
        const boundaryRegex = new RegExp(`(?:\\b|\\s|^|[,;:/])${escaped}(?:\\b|\\s|$|[,;:/])`, 'i');
        hasMatch = boundaryRegex.test(skillsText);
      }

      if (hasMatch) {
        extractedSkills.add(skillName);
        break; // Stop checking other aliases for this skill since we found a match
      }
    }
  }

  // Map to platform schema: name and a default rating of 1
  return Array.from(extractedSkills).map(name => ({
    name,
    rating: 1
  }));
}

module.exports = {
  parseSkills
};
