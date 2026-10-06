const { runHealthReview } = require('../../services/questionBank/maintenance');

// Phase 5 maintenance: evaluate question health and (with --commit) persist the
// reviewState flags. Dry-run by default — shows what WOULD change, writes nothing.
// Never regenerates or deletes; only flags questions for review.
async function run({ commit }) {
  const res = await runHealthReview({ apply: false }); // evaluate only, compute changes
  console.log(`Evaluated ${res.evaluated} non-retired questions.`);
  console.log('Health categories:');
  for (const [cat, n] of Object.entries(res.summary)) console.log(`  ${cat}: ${n}`);
  const toChange = Object.entries(res.changed).map(([s, ids]) => `${s}:${ids.length}`).join('  ');
  console.log(`\nreviewState changes pending: ${toChange}`);
  if (res.replacementCandidates.length) {
    console.log('\nReplacement candidates (first 10):');
    for (const r of res.replacementCandidates.slice(0, 10)) {
      console.log(`  ${r.id} — ${r.reasons.join('; ')}`);
    }
  }

  if (!commit) {
    console.log('\nDRY RUN — no reviewState changes written. Re-run with --commit to persist. (Counters/stats are never touched.)');
    return;
  }

  const applied = await runHealthReview({ apply: true });
  console.log(`\nCommitted reviewState flags: ${JSON.stringify(applied.persisted)}`);
}

module.exports = { run };
