// Sole Prisma access point for SkillDefinition. Nothing else under
// services/questionBank/ may import the Prisma client directly.
//
// NOTE: backend/src/config/db.js exports `{ prisma, isMock }` (a wrapper
// object), not the Prisma client itself — every existing controller
// (student.controller.js, recruiter.controller.js, auth.controller.js,
// gig.controller.js, src/index.js) destructures `{ prisma }` from it.
// Importing the module binding without destructuring would make `prisma`
// the wrapper object instead of the client, and every call below would
// throw "Cannot read properties of undefined (reading '...')".
const { prisma } = require('../../../config/db');

async function findAll() {
  return prisma.skillDefinition.findMany({
    where: { deletedAt: null },
    orderBy: { canonicalName: 'asc' },
  });
}

async function findBySlug(slug) {
  return prisma.skillDefinition.findUnique({ where: { slug } });
}

async function countAll() {
  return prisma.skillDefinition.count();
}

// Idempotent: safe to re-run seeding without duplicating rows.
// Does not overwrite `status` or `counters` — those are live state owned by
// the generation pipeline, not by the seed file.
//
// `client` defaults to the module's real Prisma binding; tests inject a
// hand-written fake here to exercise this logic without touching the
// database (see backend/tests/questionBank/skillDefinitionRepository.test.js).
async function upsertMany(definitions, client = prisma) {
  let created = 0;
  let updated = 0;

  for (const def of definitions) {
    const existing = await client.skillDefinition.findUnique({
      where: { slug: def.slug },
    });

    if (existing) {
      await client.skillDefinition.update({
        where: { slug: def.slug },
        data: {
          canonicalName: def.canonicalName,
          aliases: def.aliases,
          category: def.category,
          tier: def.tier,
          targetQuestionCount: def.targetQuestionCount,
        },
      });
      updated += 1;
    } else {
      await client.skillDefinition.create({
        data: {
          canonicalName: def.canonicalName,
          slug: def.slug,
          aliases: def.aliases,
          category: def.category,
          tier: def.tier,
          targetQuestionCount: def.targetQuestionCount,
          status: 'WAITING',
        },
      });
      created += 1;
    }
  }

  return { created, updated };
}

module.exports = { findAll, findBySlug, countAll, upsertMany };
