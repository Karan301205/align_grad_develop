const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeSkill,
  extractTargetSkillSet,
  evaluateProjectRelevance,
  rankProjectsByRequirements
} = require('../../src/modules/skills/projectRelevance.service');
const { _sanitizeProjects } = require('../../src/modules/students/student.controller');

test('projectRelevance.service - normalizeSkill', () => {
  assert.equal(normalizeSkill('  Python  '), 'python');
  assert.equal(normalizeSkill('HTML'), 'html');
  assert.equal(normalizeSkill(''), '');
  assert.equal(normalizeSkill(null), '');
  assert.equal(normalizeSkill(undefined), '');
});

test('projectRelevance.service - extractTargetSkillSet', () => {
  const requirements = [
    { skillName: 'Python', minRating: 7 },
    { skillName: '  html ', minRating: 5 },
    'CSS',
    { skill: 'React' }
  ];
  const set = extractTargetSkillSet(requirements);
  assert.equal(set.has('python'), true);
  assert.equal(set.has('html'), true);
  assert.equal(set.has('css'), true);
  assert.equal(set.has('react'), true);
  assert.equal(set.has('java'), false);
});

test('projectRelevance.service - evaluateProjectRelevance', () => {
  const targetSet = new Set(['python', 'html', 'css']);
  const project = {
    title: 'Fullstack App',
    skills: ['Python', 'HTML', 'css', 'Docker'],
    currentlyWorking: true
  };
  const result = evaluateProjectRelevance(project, targetSet);
  assert.equal(result.matchCount, 3);
  assert.deepEqual(result.matchedSkills, ['Python', 'HTML', 'css']);
  assert.equal(result.score > 300, true);
});

test('projectRelevance.service - rankProjectsByRequirements matches user scenario', () => {
  // Scenario from user prompt:
  // Job asks for Python, HTML, CSS.
  // Candidate has:
  // - Project A: tagged with Python, HTML, CSS (3 matches)
  // - Project B: tagged with Python (1 match)
  // - Project C: tagged with Rust, Docker (0 matches)
  const jobRequirements = [
    { skillName: 'Python', minRating: 6 },
    { skillName: 'HTML', minRating: 6 },
    { skillName: 'CSS', minRating: 6 }
  ];

  const candidateProjects = [
    { title: 'Project C (No match)', skills: ['Rust', 'Docker'], startDate: '2023-01-01' },
    { title: 'Project B (1 match)', skills: ['Python'], startDate: '2023-05-01' },
    { title: 'Project A (3 matches)', skills: ['python', 'HTML', 'css'], startDate: '2023-03-01' }
  ];

  const ranked = rankProjectsByRequirements(candidateProjects, jobRequirements);

  assert.equal(ranked.length, 3);
  // Project A must be #1
  assert.equal(ranked[0].title, 'Project A (3 matches)');
  assert.equal(ranked[0].matchCount, 3);
  assert.equal(ranked[0].isTopMatch, true);
  assert.deepEqual(ranked[0].matchedSkills, ['python', 'HTML', 'css']);

  // Project B must be #2
  assert.equal(ranked[1].title, 'Project B (1 match)');
  assert.equal(ranked[1].matchCount, 1);
  assert.equal(ranked[1].isTopMatch, false);

  // Project C must be #3
  assert.equal(ranked[2].title, 'Project C (No match)');
  assert.equal(ranked[2].matchCount, 0);
  assert.equal(ranked[2].isTopMatch, false);
});

test('projectRelevance.service - rankProjectsByRequirements tie breaking by recency', () => {
  const jobRequirements = [{ skillName: 'Python' }];
  const projects = [
    { title: 'Old Python Project', skills: ['Python'], startDate: '2021-01-01', currentlyWorking: false },
    { title: 'Current Python Project', skills: ['Python'], startDate: '2023-01-01', currentlyWorking: true }
  ];

  const ranked = rankProjectsByRequirements(projects, jobRequirements);
  assert.equal(ranked[0].title, 'Current Python Project');
  assert.equal(ranked[1].title, 'Old Python Project');
});

test('student.controller - _sanitizeProjects', () => {
  const rawProjects = [
    {
      title: 'Demo Project',
      skills: [' Python ', 'python', 'HTML', '', '   ', 'CSS', null],
      videoUrl: '  https://cdn.aligngrade.com/videos/demo.mp4  '
    },
    {
      title: 'Empty Video Project',
      skills: ['Go'],
      videoUrl: ''
    }
  ];
  const sanitized = _sanitizeProjects(rawProjects);
  assert.equal(sanitized.length, 2);
  // Deduplicated case-insensitively, trimmed, empty/null removed
  assert.deepEqual(sanitized[0].skills, ['Python', 'HTML', 'CSS']);
  assert.equal(sanitized[0].videoUrl, 'https://cdn.aligngrade.com/videos/demo.mp4');
  assert.equal(sanitized[1].videoUrl, null);
});

