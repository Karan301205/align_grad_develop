const { prisma } = require('../../../../infrastructure/database');

// Sole Prisma access for AssessmentRecord (Phase 5 analytics). One immutable row
// per completed assessment. `client` DI seam lets tests inject a fake. These
// records are append-only and never deleted — they preserve assessment history.

async function record(data, client = prisma) {
  return client.assessmentRecord.create({
    data: {
      candidateId: data.candidateId,
      skill: data.skill,
      questionIds: data.questionIds || [],
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      totalQuestions: data.totalQuestions,
      correctAnswers: data.correctAnswers,
      wrongAnswers: data.wrongAnswers,
      skippedQuestions: data.skippedQuestions,
      finalScore: data.finalScore,
      passed: data.passed,
    },
  });
}

async function findByCandidate(candidateId, client = prisma) {
  return client.assessmentRecord.findMany({ where: { candidateId } });
}

module.exports = { record, findByCandidate };
