// Phase 5 — configurable question-health rules. Kept OUT of the evaluation logic
// so thresholds can be tuned without touching code. Override by passing a partial
// config to evaluateHealth()/classify(); unspecified keys fall back to these.
//
// Health categories: Healthy | Needs Review | Replacement Candidate | Retired.
// Rates are computed only once a question has been answered enough times
// (minAnswersForRates) so early noise doesn't misclassify a good question.

const DEFAULT_HEALTH_CONFIG = {
  // A question needs at least this many ANSWERS (correct+wrong, skips excluded)
  // before its accuracy rate is trusted for classification.
  minAnswersForRates: 20,

  // A question needs at least this many SERVES before its skip rate is trusted
  // (prevents tiny-sample false positives, e.g. served twice, skipped once).
  minUsageForRates: 20,

  // Replacement Candidate: strong signal the question is broken/miskeyed/too hard.
  replacement: {
    maxCorrectRate: 0.25,   // <=25% get it right (after enough answers) → likely bad
    minSkipRate: 0.5,       // OR >=50% of times served it was skipped
  },

  // Needs Review: weaker signal — worth a human look but not clearly broken.
  needsReview: {
    maxCorrectRate: 0.45,   // 25%–45% correct
    minSkipRate: 0.3,       // OR >=30% skip rate
    staleReviewDays: 180,   // OR heavily used and not reviewed in this many days
    staleMinUsage: 50,      //   (only when usageCount >= this)
  },
};

module.exports = { DEFAULT_HEALTH_CONFIG };
