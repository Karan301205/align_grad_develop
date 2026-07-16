const { SKILLS_DICTIONARY } = require('../dictionaries/skills');

/**
 * Parses the projects section text to extract project entries.
 * @param {string} sectionText - The extracted text of the projects section
 * @returns {Array<object>} - Extracted projects list
 */
function parseProjects(sectionText) {
  if (!sectionText) return [];

  const projectsList = [];
  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentProj = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect if this line starts a new project
    // Project titles are typically short, capitalized, and don't start with list bullets or links
    const isCapitalized = /^[A-Z0-9][a-zA-Z0-9\s\-_&]{2,40}$/.test(line);
    const hasGithub = /github\.com/i.test(line);
    const hasHttp = /https?:\/\//i.test(line);
    
    // Check if line contains keywords indicating it is NOT a title
    const isTechLine = /tech|stack|tools|technologies|built/i.test(line);
    const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*');

    if (isCapitalized && !isBullet && !isTechLine && !hasGithub && !hasHttp && line.split(/\s+/).length <= 6) {
      if (currentProj) {
        projectsList.push(currentProj);
      }

      currentProj = {
        title: line,
        role: 'Developer', // default guess
        codeUrl: '',
        hostedUrl: '',
        startDate: '2021', // default guess
        endDate: '2021', // default guess
        currentlyWorking: false,
        description: ''
      };
      continue;
    }

    // If we have not started a project but see a link/tech line, create a default "Personal Project"
    if (!currentProj && (hasGithub || hasHttp || isBullet)) {
      currentProj = {
        title: 'Personal Project',
        role: 'Developer',
        codeUrl: '',
        hostedUrl: '',
        startDate: '2021',
        endDate: '2021',
        currentlyWorking: false,
        description: ''
      };
    }

    if (currentProj) {
      // 1. Extract Links (GitHub vs Live URL)
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
      const urls = line.match(urlRegex) || [];
      for (let url of urls) {
        url = url.replace(/[.,;:)\]]+$/, ''); // clean punctuation
        if (/github\.com/i.test(url)) {
          currentProj.codeUrl = url;
        } else {
          currentProj.hostedUrl = url;
        }
      }

      // 2. Extract Technologies/Skills mentioned in this project block
      if (isTechLine) {
        const foundTech = [];
        for (const [skillName, aliases] of Object.entries(SKILLS_DICTIONARY)) {
          for (const alias of aliases) {
            const escaped = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const boundaryRegex = new RegExp(`(?:\\b|\\s|^|[,;:/])${escaped}(?:\\b|\\s|$|[,;:/])`, 'i');
            if (boundaryRegex.test(line)) {
              foundTech.push(skillName);
              break;
            }
          }
        }
        if (foundTech.length > 0) {
          currentProj.description += (currentProj.description ? '\n' : '') + '- Technologies: ' + foundTech.join(', ');
        }
        continue;
      }

      // 3. Append bullet descriptions
      if (isBullet) {
        const cleanBullet = line.replace(/^[\-•*]\s*/, '').trim();
        if (cleanBullet) {
          currentProj.description += (currentProj.description ? '\n' : '') + '- ' + cleanBullet;
        }
      } else if (!hasGithub && !hasHttp) {
        // General text block
        currentProj.description += (currentProj.description ? '\n' : '') + '- ' + line;
      }
    }
  }

  // Save the last one
  if (currentProj) {
    projectsList.push(currentProj);
  }

  // Clean and filter empty entries
  return projectsList.map(proj => {
    if (!proj.title) proj.title = 'Personal Project';
    if (!proj.description) proj.description = '- Developed using HTML, CSS, JavaScript.';
    return proj;
  });
}

module.exports = {
  parseProjects
};
