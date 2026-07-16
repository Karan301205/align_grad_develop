/**
 * Parses the education section text to extract multiple education records.
 * @param {string} sectionText - The extracted text of the education section
 * @returns {Array<object>} - Extracted education list
 */
function parseEducation(sectionText) {
  if (!sectionText) return [];

  const educationList = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Keyword maps for degree categorization
  const degreePatterns = [
    { type: 'Doctorate', keywords: [/ph\.?d/i, /doctorate/i, /doctor of philosophy/i] },
    { type: 'Masters', keywords: [/masters/i, /master/i, /m\.?tech/i, /m\.?e\.?\b/i, /m\.?s\.?\b/i, /m\.?c\.?a/i, /m\.?b\.?a/i, /post\s*graduate/i] },
    { type: 'Bachelors', keywords: [/bachelors/i, /bachelor/i, /b\.?tech/i, /b\.?e\.?\b/i, /b\.?s\.?\b/i, /b\.?c\.?a/i, /b\.?b\.?a/i, /b\.?com/i, /undergraduate/i] },
    { type: 'Diploma', keywords: [/diploma/i] },
    { type: 'High School', keywords: [/high\s*school/i, /matric/i, /intermediate/i, /class\s*10/i, /class\s*12/i, /10th/i, /12th/i, /ssc/i, /hsc/i] }
  ];

  let currentEdu = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect if this line starts a new degree/education block
    let detectedDegreeType = null;
    let matchedPattern = '';

    for (const pattern of degreePatterns) {
      for (const regex of pattern.keywords) {
        if (regex.test(line)) {
          detectedDegreeType = pattern.type;
          matchedPattern = line;
          break;
        }
      }
      if (detectedDegreeType) break;
    }

    if (detectedDegreeType) {
      // Save previous if any
      if (currentEdu) {
        educationList.push(currentEdu);
      }
      // Start a new education entry
      currentEdu = {
        eduType: detectedDegreeType,
        institute: '',
        degree: line.substring(0, 80), // Use the text line as degree description
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        gradeType: '',
        gradeValue: ''
      };

      // Extract field of study/specialization if mentioned on the same line (e.g. "Bachelor of Technology in Computer Science")
      const specMatch = line.match(/(?:in|of)\s+([a-zA-Z\s&]{3,40})/i);
      if (specMatch && specMatch[1] && !/university|college|school/i.test(specMatch[1])) {
        currentEdu.fieldOfStudy = specMatch[1].trim();
      }
      continue;
    }

    // If we haven't started an entry yet, create a default "Bachelors" entry if we see an institute or university
    if (!currentEdu) {
      if (/university|college|institute|school|academy/i.test(line)) {
        currentEdu = {
          eduType: 'Bachelors', // default guess
          institute: line,
          degree: 'Degree / Academic Qualification',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          gradeType: '',
          gradeValue: ''
        };
        continue;
      }
    }

    if (currentEdu) {
      // 1. Extract Grade (CGPA, GPA, Percentage)
      const cgpaRegex = /\b(?:cgpa|gpa|grade|score)\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?(?:\s*\/\s*\d{1,2})?)\b/i;
      const pctRegex = /\b(\d{1,2}(?:\.\d{1,2})?\s*%)\b/;
      
      const cgpaMatch = line.match(cgpaRegex);
      const pctMatch = line.match(pctRegex);

      if (cgpaMatch && cgpaMatch[1]) {
        currentEdu.gradeType = 'CGPA';
        currentEdu.gradeValue = cgpaMatch[1].trim();
      } else if (pctMatch && pctMatch[1]) {
        currentEdu.gradeType = 'Percentage';
        currentEdu.gradeValue = pctMatch[1].trim();
      } else if (/\b\d{1,2}\.\d{1,2}\s*\/\s*10\b/.test(line)) {
        const directCgpa = line.match(/(\d{1,2}\.\d{1,2}\s*\/\s*10)/);
        currentEdu.gradeType = 'CGPA';
        currentEdu.gradeValue = directCgpa[0].trim();
      }

      // 2. Extract passing year/dates (e.g. 2018 - 2022 or passing in 2021)
      const yearRangeRegex = /\b(19\d{2}|20\d{2})\s*[-–—\s]+\s*(19\d{2}|20\d{2}|present)\b/i;
      const singleYearRegex = /\b(19\d{2}|20\d{2})\b/;
      
      const rangeMatch = line.match(yearRangeRegex);
      if (rangeMatch) {
        currentEdu.startDate = rangeMatch[1].trim();
        currentEdu.endDate = rangeMatch[2].trim();
      } else {
        const yearMatch = line.match(singleYearRegex);
        // Only treat as end year if we don't already have one
        if (yearMatch && !currentEdu.endDate) {
          currentEdu.endDate = yearMatch[1].trim();
          currentEdu.startDate = String(parseInt(yearMatch[1]) - 4); // guess 4 years back
        }
      }

      // 3. Extract Institute/University
      if (/university|college|institute|school|academy|high\s*school|h\.?s\.?\b/i.test(line)) {
        if (!currentEdu.institute) {
          currentEdu.institute = line;
        }
      }
    }
  }

  // Add the last entry if populated
  if (currentEdu) {
    educationList.push(currentEdu);
  }

  // Post-processing cleaning
  return educationList.map(edu => {
    // Fill default dates if missing
    if (!edu.startDate) edu.startDate = '2018';
    if (!edu.endDate) edu.endDate = '2022';
    // Fill default institute if missing
    if (!edu.institute) edu.institute = 'Institution Name';
    // Clean up field of study
    if (!edu.fieldOfStudy) edu.fieldOfStudy = 'General';
    return edu;
  });
}

module.exports = {
  parseEducation
};
