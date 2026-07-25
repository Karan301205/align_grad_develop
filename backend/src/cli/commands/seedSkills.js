const seedData = require('../../services/questionBank/skills/seedData.json');
const { buildAliasIndex } = require('../../services/questionBank/skills/normalize');
const repo = require('../../services/questionBank/repositories/skillDefinitionRepository');

async function run({ commit }) {
  // Validate before touching the database. A collision here means bad seed data.
  const index = buildAliasIndex(seedData);

  const byTier = seedData.reduce((acc, d) => {
    acc[d.tier] = (acc[d.tier] || 0) + 1;
    return acc;
  }, {});

  console.log(`Seed file: ${seedData.length} definitions`);
  console.log(`  Tier 1: ${byTier[1] || 0}  Tier 2: ${byTier[2] || 0}  Tier 3: ${byTier[3] || 0}`);
  console.log(`  Alias index: ${index.size} recognised spellings`);

  const existingCount = await repo.countAll();
  console.log(`  Existing rows in database: ${existingCount}`);

  if (!commit) {
    console.log('\nDRY RUN — no changes written. Re-run with --commit to persist.');
    return;
  }

  const { created, updated } = await repo.upsertMany(seedData);
  console.log(`\nCommitted: ${created} created, ${updated} updated.`);
}

module.exports = { run };
