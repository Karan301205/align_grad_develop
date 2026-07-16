/**
 * Normalizes raw extracted text for consistent rule-based parsing.
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned and normalized text
 */
function normalizeText(text) {
  if (!text) return '';

  // 1. Normalize Unicode characters (smart quotes, dashes, etc.)
  let normalized = text
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // En/em dashes
    .replace(/\u2022/g, '•') // Standardize bullet points
    .replace(/\r\n/g, '\n') // Standardize line endings
    .replace(/\r/g, '\n');

  // 2. Remove page numbers
  normalized = normalized.replace(/page\s+\d+(\s+of\s+\d+)?/gi, '');
  normalized = normalized.replace(/\b\d+\s*\/\s*\d+\b/g, ''); // e.g. 1/3

  // 3. Merge broken words split by hyphenated newlines
  normalized = normalized.replace(/(\w+)-\n(\w+)/g, '$1$2');

  // 4. Normalize lists/bullets (maps standard markers to '- ')
  normalized = normalized.replace(/^[ \t]*[•*▪\-\u2022\u25aa\u25fe][ \t]*/gm, '- ');

  // 5. Remove horizontal trailing/leading spaces per line, collapse extra spaces
  normalized = normalized.split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');

  // 6. Remove repeated blank lines (allow maximum of 1 blank line between blocks)
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  return normalized.trim();
}

module.exports = {
  normalizeText
};
