const { prisma } = require('../../../config/db');

// Sole Prisma access for TestSession. The `client` DI seam lets tests inject a
// fake in-memory client. A session is valid only if it exists, belongs to the
// requesting user, is unused, and has not expired.

async function create({ userId, skillName, answerKey, questionIds = [], expiresAt }, client = prisma) {
  return client.testSession.create({
    data: { userId, skillName, answerKey, questionIds, expiresAt, used: false },
  });
}

async function findValidForUser(id, userId, client = prisma) {
  const s = await client.testSession.findUnique({ where: { id } });
  if (!s || s.userId !== userId || s.used || new Date(s.expiresAt) < new Date()) return null;
  return s;
}

async function markUsed(id, { score, passed }, client = prisma) {
  return client.testSession.update({ where: { id }, data: { used: true, score, passed } });
}

module.exports = { create, findValidForUser, markUsed };
