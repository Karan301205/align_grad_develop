// Pure validation for generated interview MCQs (Phase 3). No I/O, provider-agnostic.
// Enforces the Phase 3 per-question checks: exactly 4 distinct options, exactly one
// correct answer (correctIndex 0-3), a non-empty explanation, an allowed difficulty,
// and (when context is supplied) that the question is tagged to the right skill/subtopic.
const ALLOWED_DIFFICULTY = new Set(['Medium', 'Medium-Hard', 'Hard']);

function normalizeText(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Validate a single MCQ. `ctx` optionally carries { skillName, subtopic } for match checks.
function validateQuestion(q, ctx = {}) {
  const errors = [];
  if (!q || typeof q !== 'object') return { valid: false, errors: ['not an object'] };

  if (typeof q.question !== 'string' || !q.question.trim()) errors.push('question text missing');

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push('must have exactly 4 options');
  } else {
    if (q.options.some(o => typeof o !== 'string' || !o.trim())) errors.push('empty/non-string option');
    if (new Set(q.options.map(normalizeText)).size !== 4) errors.push('duplicate options');
  }

  if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
    errors.push('correctIndex must be an integer 0-3 (exactly one correct answer)');
  }
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) errors.push('explanation missing');
  if (!ALLOWED_DIFFICULTY.has(q.difficulty)) errors.push(`difficulty must be Medium|Medium-Hard|Hard (got "${q.difficulty}")`);

  if (ctx.skillName && q.skillName && normalizeText(q.skillName) !== normalizeText(ctx.skillName)) errors.push('skill mismatch');
  if (ctx.subtopic && q.subtopic && normalizeText(q.subtopic) !== normalizeText(ctx.subtopic)) errors.push('subtopic mismatch');

  return { valid: errors.length === 0, errors };
}

module.exports = { validateQuestion, normalizeText, ALLOWED_DIFFICULTY };
