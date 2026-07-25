const { prisma } = require('../../../config/db');

// Sole Prisma access for the Question bank in the assessment path (Phase 4).
// The `client` DI seam lets tests inject a fake/mock client.
//
// All counter mutations use MongoDB atomic `$inc` (Prisma `{ increment }`) so
// concurrent assessments never overwrite each other's counts. Reads never leak
// the answer key or metadata to callers that forward to the client — the
// controller is responsible for stripping to { id, question, options }.

// ACTIVE questions for a skill (case-insensitive). RETIRED/FLAGGED are excluded.
async function findActiveBySkill(skillName, client = prisma) {
  return client.question.findMany({
    where: { skillName: { equals: skillName, mode: 'insensitive' }, status: 'ACTIVE' },
  });
}

// A question is "served" the moment it is placed into an assessment: bump
// usageCount and stamp lastUsed. One atomic updateMany over all served ids.
async function recordServed(ids, client = prisma) {
  const list = (ids || []).filter(Boolean);
  if (list.length === 0) return { count: 0 };
  return client.question.updateMany({
    where: { id: { in: list } },
    data: { usageCount: { increment: 1 }, lastUsed: new Date() },
  });
}

// After scoring, attribute each served question to exactly one bucket.
// correctIds/wrongIds/skipIds are disjoint. Each bucket is one atomic updateMany.
async function recordOutcomes({ correctIds = [], wrongIds = [], skipIds = [] }, client = prisma) {
  const ops = [];
  if (correctIds.length) ops.push(client.question.updateMany({ where: { id: { in: correctIds } }, data: { correctCount: { increment: 1 } } }));
  if (wrongIds.length) ops.push(client.question.updateMany({ where: { id: { in: wrongIds } }, data: { wrongCount: { increment: 1 } } }));
  if (skipIds.length) ops.push(client.question.updateMany({ where: { id: { in: skipIds } }, data: { skipCount: { increment: 1 } } }));
  await Promise.all(ops);
  return { correct: correctIds.length, wrong: wrongIds.length, skip: skipIds.length };
}

// --- Phase 5 maintenance reads/writes ---

// All non-retired questions (optionally scoped to a skill) for the health review.
async function findForReview({ skillName } = {}, client = prisma) {
  const where = { status: { not: 'RETIRED' } };
  if (skillName) where.skillName = { equals: skillName, mode: 'insensitive' };
  return client.question.findMany({ where });
}

// Persist a maintenance decision. ONLY touches reviewState + lastReviewed — every
// usage/outcome counter is left intact (historical stats are never destroyed).
// The question keeps its ACTIVE status so it stays servable until a replacement
// is approved (a later phase). Grouped into one atomic updateMany per state.
async function setReviewStates(idsByState, client = prisma) {
  const out = {};
  for (const [state, ids] of Object.entries(idsByState || {})) {
    const list = (ids || []).filter(Boolean);
    if (!list.length) { out[state] = 0; continue; }
    await client.question.updateMany({
      where: { id: { in: list } },
      data: { reviewState: state, lastReviewed: new Date() },
    });
    out[state] = list.length;
  }
  return out;
}

module.exports = { findActiveBySkill, recordServed, recordOutcomes, findForReview, setReviewStates };
