const { prisma } = require('../../infrastructure/database');
const { cached } = require('../../shared/cache/ttlCache');

// Skills that have an active test in the question bank (lower-cased names). Read on every
// job list, gig list and recruiter candidate count, and it only changes when the bank is
// edited, so it is cached for a minute instead of scanning the bank on each request.
const QUIZ_SKILLS_TTL_MS = 60 * 1000;

function getQuizSkills() {
  return cached('quiz-skills', QUIZ_SKILLS_TTL_MS, async () => {
    const activeQuestions = await prisma.question.findMany({
      where: { status: 'ACTIVE' },
      select: { skillName: true },
      distinct: ['skillName']
    });
    return new Set(activeQuestions.map((q) => q.skillName.toLowerCase()));
  });
}

module.exports = { getQuizSkills };
