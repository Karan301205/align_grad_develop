/**
 * Parses the certifications section text to extract individual credentials.
 * @param {string} sectionText - The extracted text of the certifications section
 * @returns {Array<object>} - Extracted certifications list
 */
function parseCertifications(sectionText) {
  if (!sectionText) return [];

  const certificationsList = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Common issuing organizations
  const orgKeywords = [
    'Amazon Web Services', 'AWS', 'Google', 'Microsoft', 'Oracle', 'IBM', 'Udemy',
    'Coursera', 'Scrum Alliance', 'Cisco', 'Salesforce', 'Pluralsight', 'LinkedIn Learning',
    'freeCodeCamp', 'EdX', 'Simplilearn', 'Stanford University', 'MIT'
  ];

  for (let line of lines) {
    // Strip bullets at start
    line = line.replace(/^[\-•*]\s*/, '').trim();
    if (!line) continue;

    const cert = {
      title: '',
      org: 'Certification Provider',
      startDate: '2021', // acts as completion year / date in schema
      link: '',
      certNumber: '',
      description: '',
      attachment: ''
    };

    // 1. Extract Year (4-digit number starting with 20 or 19)
    const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      cert.startDate = yearMatch[1];
    }

    // 2. Extract Organization from list or delimiters
    let detectedOrg = '';
    for (const org of orgKeywords) {
      const regex = new RegExp(`\\b${org}\\b`, 'i');
      if (regex.test(line)) {
        detectedOrg = org;
        break;
      }
    }

    if (detectedOrg) {
      cert.org = detectedOrg;
    } else {
      // Split by common delimiters (dash, comma, pipe, or brackets) to guess
      const parts = line.split(/[-–—,|(|)]/).map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 2) {
        // If there's a year in one of the parts, ignore it as the org name
        const nonYearParts = parts.filter(p => !/\b(19\d{2}|20\d{2})\b/.test(p));
        if (nonYearParts.length >= 2) {
          cert.org = nonYearParts[1];
        }
      }
    }

    // 3. Extract Certification Title
    // Usually the first part before any delimiter or the whole line excluding the org and year
    const parts = line.split(/[-–—,|]/).map(p => p.trim()).filter(p => p.length > 0);
    cert.title = parts[0] || line;

    // Clean up title (remove year or brackets)
    cert.title = cert.title.replace(/\b(19\d{2}|20\d{2})\b/g, '').replace(/[\(\)\[\]]+/g, '').trim();

    // Avoid duplicate or empty entries
    if (cert.title.length > 3) {
      certificationsList.push(cert);
    }
  }

  return certificationsList;
}

module.exports = {
  parseCertifications
};
