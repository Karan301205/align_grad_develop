const mammoth = require('mammoth');

/**
 * Extracts raw text from a DOCX file buffer.
 * @param {Buffer} buffer - The DOCX file buffer
 * @returns {Promise<string>} - The extracted raw text
 */
async function extractText(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    console.error('DOCX text extraction error:', err);
    throw new Error('Failed to parse DOCX document. It might be corrupted.');
  }
}

module.exports = {
  extractText
};
