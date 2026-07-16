/**
 * Parses the experience section text to extract work experience entries.
 * @param {string} sectionText - The extracted text of the experience section
 * @returns {Array<object>} - Extracted experience list
 */
function parseExperience(sectionText) {
  if (!sectionText) return [];

  const experienceList = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Common designation keywords
  const roleKeywords = [
    /engineer/i, /developer/i, /analyst/i, /consultant/i, /manager/i, /intern\b/i, /internship/i,
    /specialist/i, /lead/i, /architect/i, /programmer/i, /designer/i, /administrator/i, /associate/i,
    /writer/i, /strategist/i, /officer/i, /head\b/i, /director/i, /founder/i, /co-founder/i
  ];

  // Date range regexes: e.g. "June 2021 - Present", "2019-2021", "03/2018 to 04/2020"
  const dateRangeRegex = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[01]?\d)[-./\s]*(?:20\d{2}|\d{2})?\s*(?:to|-|–|—)\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[01]?\d)?[-./\s]*(?:20\d{2}|\d{2}|present)\b/i;
  const simpleYearRangeRegex = /\b(20\d{2})\s*[-–—\s]+\s*(20\d{2}|present)\b/i;

  let currentExp = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect if this line starts a new job entry
    const hasDates = dateRangeRegex.test(line) || simpleYearRangeRegex.test(line);
    let hasRole = false;
    for (const regex of roleKeywords) {
      if (regex.test(line)) {
        hasRole = true;
        break;
      }
    }

    // A line starting a new experience entry typically has a role, or dates, or both
    if (hasRole || (hasDates && !currentExp)) {
      if (currentExp) {
        experienceList.push(currentExp);
      }

      currentExp = {
        expType: 'Full-Time', // default
        designation: '',
        involvesTech: true,
        companyName: '',
        domain: 'Engineering', // default
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        location: '',
        description: ''
      };

      // Set Designation if found on the line
      if (hasRole) {
        currentExp.designation = line;
      } else {
        currentExp.designation = 'Software Engineer';
      }

      // Check dates in the current line
      const datesMatch = line.match(dateRangeRegex) || line.match(simpleYearRangeRegex);
      if (datesMatch) {
        const parts = datesMatch[0].split(/[-–—to]/i).map(p => p.trim());
        currentExp.startDate = parts[0] || '2020';
        currentExp.endDate = parts[1] || 'Present';
        currentExp.currentlyWorking = /present/i.test(currentExp.endDate);
      }

      // Try to find the company name on the next line or on the same line if split by comma/pipe
      if (line.includes(',') || line.includes('|')) {
        const segments = line.split(/[,|]/).map(s => s.trim());
        // Assume designation is first segment, company is second
        if (hasRole) {
          currentExp.designation = segments[0];
          currentExp.companyName = segments[1] || 'Company Name';
        }
      } else if (i + 1 < lines.length && !lines[i + 1].startsWith('-') && !dateRangeRegex.test(lines[i + 1])) {
        // Assume next line contains company name / location
        const nextLine = lines[i + 1];
        if (nextLine.includes(',') || nextLine.includes('|')) {
          const parts = nextLine.split(/[,|]/).map(p => p.trim());
          currentExp.companyName = parts[0];
          currentExp.location = parts[1] || '';
        } else {
          currentExp.companyName = nextLine;
        }
        // Increment index so we skip processing the company line as a separate item
        i++;
      } else {
        currentExp.companyName = 'Company Name';
      }
      continue;
    }

    if (currentExp) {
      // Check if dates are on a separate line
      const datesMatch = line.match(dateRangeRegex) || line.match(simpleYearRangeRegex);
      if (datesMatch && (!currentExp.startDate || currentExp.startDate === '2020')) {
        const parts = datesMatch[0].split(/[-–—to]/i).map(p => p.trim());
        currentExp.startDate = parts[0] || '2020';
        currentExp.endDate = parts[1] || 'Present';
        currentExp.currentlyWorking = /present/i.test(currentExp.endDate);
        continue;
      }

      // Check for location pattern if not already set (e.g. "San Francisco, CA" or "Bangalore")
      if (!currentExp.location && /[a-zA-Z]+,\s*[a-zA-Z]{2,}/.test(line) && line.length < 30) {
        currentExp.location = line;
        continue;
      }

      // Append description details
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        const cleanBullet = line.replace(/^[\-•*]\s*/, '').trim();
        if (cleanBullet) {
          currentExp.description += (currentExp.description ? '\n' : '') + '- ' + cleanBullet;
        }
      } else {
        // General text block under this experience
        currentExp.description += (currentExp.description ? '\n' : '') + '- ' + line;
      }
    }
  }

  // Save the last one
  if (currentExp) {
    experienceList.push(currentExp);
  }

  // Post-processing cleaning
  return experienceList.map(exp => {
    if (!exp.startDate) exp.startDate = '2020';
    if (!exp.endDate) exp.endDate = 'Present';
    if (!exp.companyName) exp.companyName = 'Company Name';
    if (!exp.designation) exp.designation = 'Software Engineer';
    
    // Categorize intern/full-time
    if (/intern/i.test(exp.designation)) {
      exp.expType = 'Internship';
    } else {
      exp.expType = 'Full-Time';
    }
    
    // Check if technology is involved (almost always true in IT resumes)
    exp.involvesTech = true;

    return exp;
  });
}

module.exports = {
  parseExperience
};
