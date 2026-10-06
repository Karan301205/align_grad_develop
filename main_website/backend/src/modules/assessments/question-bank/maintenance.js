// Phase 5 — Question Bank maintenance / replacement workflow.
//
// runHealthReview evaluates the bank against the (configurable) health rules and
// PERSISTS the review decision for each question via reviewState. It is the
// "replacement workflow": it only FLAGS questions for human review — it never
// regenerates, never deletes, and never removes historical statistics. Questions
// flagged as Replacement Candidate stay ACTIVE and keep being served until a
// replacement is explicitly approved in a later phase.
//
// Invoke on demand (CLI: `node src/cli runHealthReview [skill]`) or from a
// scheduled job — NOT automatically on every assessment.

const { classify, REVIEW_STATE, CATEGORY } = require('./health');
const questionRepo = require('./repositories/questionRepository');

async function runHealthReview({ skillName, config, apply = true, client, now } = {}) {
  const questions = await questionRepo.findForReview({ skillName }, client);
  const { results, summary } = classify(questions, config, now);

  // Group ids by the reviewState we intend to persist (skip Retired → NONE noise
  // only where it would change nothing).
  const idsByState = { NONE: [], NEEDS_REVIEW: [], REPLACEMENT_CANDIDATE: [] };
  const current = new Map(questions.map((q) => [q.id, q.reviewState || 'NONE']));
  for (const r of results) {
    const target = r.reviewState; // NONE | NEEDS_REVIEW | REPLACEMENT_CANDIDATE
    if (current.get(r.id) === target) continue; // no change → no write
    idsByState[target].push(r.id);
  }

  let persisted = { NONE: 0, NEEDS_REVIEW: 0, REPLACEMENT_CANDIDATE: 0 };
  if (apply) {
    persisted = await questionRepo.setReviewStates(idsByState, client);
  }
  console.log('[health-review]', { evaluated: questions.length, summary, applied: apply, persisted });

  return {
    evaluated: questions.length,
    summary,                                  // counts per health category
    changed: idsByState,                      // ids whose reviewState changed
    persisted,                                // counts actually written (0s if apply=false)
    replacementCandidates: results.filter((r) => r.category === CATEGORY.REPLACEMENT),
  };
}

module.exports = { runHealthReview };
