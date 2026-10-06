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
      // JPEG: FFD8FF, PNG: 89504E47, WEBP: 52494646 (RIFF), GIF: 47494638 (GIF8)
      return hex === '89504E47' || hex.startsWith('FFD8FF') || hex === '52494646' || hex === '47494638';

    case 'video': {
      // WebM / MKV: 1A45DFA3
      if (hex === '1A45DFA3') return true;
      // Ogg video: 4F676753 (OggS)
      if (hex === '4F676753') return true;
      // AVI: 52494646 (RIFF)
      if (hex === '52494646') return true;
      // MP4 / MOV / QuickTime: check for standard video atom identifiers in the header
      if (buffer.length >= 8) {
        const headerSlice = buffer.slice(0, Math.min(buffer.length, 32)).toString('binary');
        if (
          headerSlice.includes('ftyp') ||
          headerSlice.includes('moov') ||
          headerSlice.includes('mdat') ||
          headerSlice.includes('wide') ||
          headerSlice.includes('free') ||
          headerSlice.includes('skip')
        ) {
          return true;
        }
      }
      return false;
    }

    case 'doc':
      // Allowed: PDF (25504446), PNG (89504E47), JPEG (FFD8FF), WEBP (52494646), GIF (47494638), Zip container/Office docs (504B0304 - PK..)
      // Also allow text/binary files if non-zero length
      return hex === '25504446' || hex === '89504E47' || hex.startsWith('FFD8FF') || hex === '504B0304' || hex === '52494646' || hex === '47494638' || buffer.length > 0;

    default:
      return false;
  }
};

module.exports = { validateMagicBytes };
