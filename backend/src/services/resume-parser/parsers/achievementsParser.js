/**
 * Parses the achievements section text to extract bulleted items.
 * @param {string} sectionText - The extracted text of the achievements section
 * @returns {Array<string>} - List of achievements
 */
function parseAchievements(sectionText) {
  if (!sectionText) return [];

  return sectionText
    .split('\n')
    .map(line => line.trim())
    .map(line => line.replace(/^[\-•*]\s*/, '').trim()) // Strip bullets
    .filter(line => line.length > 5); // Exclude very short noise lines
}

module.exports = {
  parseAchievements
};
