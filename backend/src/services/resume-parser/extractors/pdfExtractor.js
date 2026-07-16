const { PDFParse } = require('pdf-parse');

/**
 * Extracts raw text from a PDF file buffer.
 * @param {Buffer} buffer - The PDF file buffer
 * @returns {Promise<string>} - The extracted raw text
 */
async function extractText(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    return data.text || '';
  } catch (err) {
    console.error('PDF text extraction error:', err);
    throw new Error('Failed to parse PDF document. It might be corrupted or password-protected.');
  }
}

module.exports = {
  extractText
};
