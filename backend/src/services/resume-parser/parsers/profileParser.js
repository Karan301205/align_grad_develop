/**
 * Extracts basic information from the resume text.
 * @param {string} text - Normalized full resume text
 * @param {object} sections - Text split by sections
 * @returns {object} - Extracted basic info
 */
function parseProfile(text, sections) {
  const basicInfo = {
    name: '',
    email: '',
    phone: '',
    location: '',
    dob: '',
    portfolio: '',
    linkedin: '',
    github: '',
    bio: ''
  };

  // 1. Extract Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    basicInfo.email = emails[0].trim();
  }

  // 2. Extract Phone
  // Matches +91 9999999999, +1-555-555-5555, (555) 555-5555, 9999999999, etc.
  const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    // Filter matches that are at least 8 digits to avoid matching years/zip codes
    const validPhones = phones.filter(p => p.replace(/\D/g, '').length >= 9);
    if (validPhones.length > 0) {
      basicInfo.phone = validPhones[0].trim();
    }
  }

  // 3. Extract URLs (LinkedIn, GitHub, Portfolio)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const urls = text.match(urlRegex) || [];
  
  for (let url of urls) {
    // Clean trailing punctuation
    url = url.replace(/[.,;:)\]]+$/, '');

    if (/linkedin\.com/i.test(url)) {
      if (!basicInfo.linkedin) basicInfo.linkedin = url;
    } else if (/github\.com/i.test(url)) {
      if (!basicInfo.github) basicInfo.github = url;
    } else if (!/gmail|yahoo|hotmail|outlook|leetcode|hackerearth|hackerrank|codechef/i.test(url)) {
      // General website or portfolio
      if (!basicInfo.portfolio) basicInfo.portfolio = url;
    }
  }

  // 4. Extract Location
  // Look for "Location: ...", "Address: ...", "City: ..." or standard patterns
  const locationKeywords = [
    /location\s*:\s*([^\n]+)/i,
    /address\s*:\s*([^\n]+)/i,
    /residence\s*:\s*([^\n]+)/i,
    /lives\s+in\s+([^\n]+)/i
  ];
  for (const regex of locationKeywords) {
    const match = text.match(regex);
    if (match && match[1]) {
      basicInfo.location = match[1].trim();
      break;
    }
  }

  // Fallback location detection: look around email line
  if (!basicInfo.location) {
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i];
      // If line contains state/city pattern like "Bangalore, India" or "City, State Zip"
      const locationPattern = /[a-zA-Z\s]{3,30},\s*[a-zA-Z\s]{2,20}/;
      if (locationPattern.test(line) && !line.includes('@') && !line.includes('http') && line.length < 50) {
        basicInfo.location = line.trim();
        break;
      }
    }
  }

  // 5. Extract DOB (Date of Birth)
  const dobRegexes = [
    /(?:dob|date of birth|birthdate|birth date)\s*[:\-]?\s*([^\n]+)/i,
    /\b(?:dob|born)\s*[:\-]?\s*(\d{1,2}[-.\/]\d{1,2}[-.\/]\d{2,4})\b/i
  ];
  for (const regex of dobRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      // Extract date representation
      basicInfo.dob = match[1].trim().replace(/\s+.*$/, ''); // clean up extra words on line
      break;
    }
  }

  // 6. Extract Full Name
  // Look at the top of the resume (first 10 non-empty lines)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    // Skip if line has contact info or looks like a header/label or is too long/short
    if (line.includes('@') || line.includes(':') || line.includes('/') || line.includes('\\') || /\b(resume|cv|curriculum|profile|email|phone|contact)\b/i.test(line)) {
      continue;
    }
    // Check if line contains 2 to 4 words and is mostly letters
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && /^[a-zA-Z.\s]+$/.test(line)) {
      basicInfo.name = line;
      break;
    }
  }

  // 7. Extract Bio
  // Look for profile/summary/objective section text
  const bioSectionKeys = ['profile', 'summary', 'objective'];
  for (const key of bioSectionKeys) {
    if (sections[key] && sections[key].trim().length > 10) {
      basicInfo.bio = sections[key].trim();
      break;
    }
  }

  // Fallback: If no bio section, use the first 3 lines of resume
  if (!basicInfo.bio && lines.length > 0) {
    // Collect 3 sentences or non-empty lines that don't contain contact info
    const introLines = lines.slice(0, 10).filter(l => {
      return !l.includes('@') && !l.includes('http') && !l.includes('+') && !/^\d+$/.test(l) && l.length > 15;
    });
    if (introLines.length > 0) {
      basicInfo.bio = introLines.slice(0, 2).join(' ');
    }
  }

  return basicInfo;
}

module.exports = {
  parseProfile
};
