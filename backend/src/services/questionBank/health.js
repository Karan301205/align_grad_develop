// Phase 5 — question health evaluation. PURE (no I/O): classify a question from
// its collected metadata. Rules come from healthConfig (configurable, not
// hardcoded); callers may pass a partial override.
//
// Categories: 'Healthy' | 'Needs Review' | 'Replacement Candidate' | 'Retired'.
// Retired is driven by status; the others by usage/accuracy/skip/staleness.

const { DEFAULT_HEALTH_CONFIG } = require('./healthConfig');

const CATEGORY = {
  HEALTHY: 'Healthy',
  NEEDS_REVIEW: 'Needs Review',
  REPLACEMENT: 'Replacement Candidate',
  RETIRED: 'Retired',
};

// Map a category to the persisted Question.reviewState (Retired is a status, not
// a reviewState, so it maps to NONE here).
const REVIEW_STATE = {
  [CATEGORY.HEALTHY]: 'NONE',
  [CATEGORY.NEEDS_REVIEW]: 'NEEDS_REVIEW',
  [CATEGORY.REPLACEMENT]: 'REPLACEMENT_CANDIDATE',
  [CATEGORY.RETIRED]: 'NONE',
};

function mergeConfig(override) {
  const d = DEFAULT_HEALTH_CONFIG;
  const o = override || {};
  return {
    minAnswersForRates: o.minAnswersForRates ?? d.minAnswersForRates,
    minUsageForRates: o.minUsageForRates ?? d.minUsageForRates,
    replacement: { ...d.replacement, ...(o.replacement || {}) },
    needsReview: { ...d.needsReview, ...(o.needsReview || {}) },
  };
}

function daysBetween(a, b) {
  return Math.floor((a.getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * @param {Object} q      Question row (usageCount, correctCount, wrongCount, skipCount, lastUsed, lastReviewed, status)
 * @param {Object} config partial health-config override
 * @param {Date}   now    injectable clock (defaults to new Date()) for testability
 * @returns {{category, reviewState, reasons: string[], metrics}}
 */
function evaluateHealth(q, config, now = new Date()) {
  const cfg = mergeConfig(config);
  const usage = q.usageCount || 0;
  const correct = q.correctCount || 0;
  const wrong = q.wrongCount || 0;
  const skip = q.skipCount || 0;
  const answered = correct + wrong;
  const correctRate = answered > 0 ? correct / answered : null;
  const skipRate = usage > 0 ? skip / usage : 0;
  const metrics = { usage, correct, wrong, skip, answered, correctRate, skipRate };
  const reasons = [];

  // Retired is terminal and independent of stats.
  if (q.status === 'RETIRED') {
    return { category: CATEGORY.RETIRED, reviewState: 'NONE', reasons: ['status is RETIRED'], metrics };
  }

  const enoughAnswers = answered >= cfg.minAnswersForRates;

  // Replacement Candidate — clearest failure signals.
  if (enoughAnswers && correctRate !== null && correctRate <= cfg.replacement.maxCorrectRate) {
    reasons.push(`correctRate ${(correctRate * 100).toFixed(0)}% <= ${cfg.replacement.maxCorrectRate * 100}% over ${answered} answers`);
  }
  if (usage >= cfg.minUsageForRates && skipRate >= cfg.replacement.minSkipRate) {
    reasons.push(`skipRate ${(skipRate * 100).toFixed(0)}% >= ${cfg.replacement.minSkipRate * 100}%`);
  }
  if (reasons.length) {
    return { category: CATEGORY.REPLACEMENT, reviewState: REVIEW_STATE[CATEGORY.REPLACEMENT], reasons, metrics };
  }

  // Needs Review — softer signals.
  if (enoughAnswers && correctRate !== null && correctRate <= cfg.needsReview.maxCorrectRate) {
    reasons.push(`correctRate ${(correctRate * 100).toFixed(0)}% <= ${cfg.needsReview.maxCorrectRate * 100}%`);
  }
  if (usage >= cfg.minUsageForRates && skipRate >= cfg.needsReview.minSkipRate) {
    reasons.push(`skipRate ${(skipRate * 100).toFixed(0)}% >= ${cfg.needsReview.minSkipRate * 100}%`);
  }
  if (usage >= cfg.needsReview.staleMinUsage) {
    const ageDays = q.lastReviewed ? daysBetween(now, q.lastReviewed) : Infinity;
    if (ageDays >= cfg.needsReview.staleReviewDays) {
      reasons.push(q.lastReviewed ? `not reviewed in ${ageDays}d (usage ${usage})` : `never reviewed (usage ${usage})`);
    }
  }
  if (reasons.length) {
    return { category: CATEGORY.NEEDS_REVIEW, reviewState: REVIEW_STATE[CATEGORY.NEEDS_REVIEW], reasons, metrics };
  }

  return { category: CATEGORY.HEALTHY, reviewState: 'NONE', reasons: [], metrics };
}

// Evaluate a list; returns per-question results plus a category tally.
function classify(questions, config, now = new Date()) {
  const results = (questions || []).map((q) => ({ id: q.id, ...evaluateHealth(q, config, now) }));
  const summary = { [CATEGORY.HEALTHY]: 0, [CATEGORY.NEEDS_REVIEW]: 0, [CATEGORY.REPLACEMENT]: 0, [CATEGORY.RETIRED]: 0 };
  for (const r of results) summary[r.category]++;
  return { results, summary };
}

module.exports = { evaluateHealth, classify, mergeConfig, CATEGORY, REVIEW_STATE };
