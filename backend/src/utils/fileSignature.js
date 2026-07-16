/**
 * Validates file magic bytes (signatures) to prevent MIME-type spoofing.
 * Extracted verbatim from upload.controller.js so the binary-signature policy
 * lives in one focused, testable place.
 */
const validateMagicBytes = (buffer, fileType) => {
  if (!buffer || buffer.length < 4) return false;

  // Read first 4 bytes as hex string
  const hex = buffer.toString('hex', 0, 4).toUpperCase();

  switch (fileType) {
    case 'resume':
      // Must be PDF: 25504446 (%PDF) or DOCX: 504B0304 (PK..)
      return hex === '25504446' || hex === '504B0304';

    case 'image':
      // JPEG: FFD8FF
      // PNG: 89504E47
      return hex === '89504E47' || hex.startsWith('FFD8FF');

    case 'video':
      // MP4: 66747970 ('ftyp') at offset 4 (so first 4 bytes can vary but contain ftyp starting at 4)
      // WebM: 1A45DFA3
      return hex === '1A45DFA3' || (buffer.length >= 8 && buffer.toString('hex', 4, 8).toUpperCase() === '66747970');

    case 'doc':
      // Allowed: PDF (25504446), PNG (89504E47), JPEG (FFD8FF), or Office docs (Zip container: 504B0304 - PK..)
      return hex === '25504446' || hex === '89504E47' || hex.startsWith('FFD8FF') || hex === '504B0304';

    default:
      return false;
  }
};

module.exports = { validateMagicBytes };
