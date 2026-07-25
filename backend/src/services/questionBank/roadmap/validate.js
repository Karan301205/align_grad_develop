// Pure validation for skill roadmaps. No I/O, source-agnostic (works the same
// whether the data came from Bedrock, Groq, or anywhere else). Enforces the
// Phase 1 deliverable checks:
//   - every roadmap has a complete 10-15 subtopic set, deduped and non-empty;
//   - across the whole set every skill appears once with a unique, contiguous
//     1..N popularity rank, and every expected skill is covered.

const MIN_SUBTOPICS = 10;
const MAX_SUBTOPICS = 15;

function norm(s) {
  return typeof s === 'string' ? s.trim().toLowerCase() : '';
}

// Validate a single roadmap record. Returns { valid, errors[] }.
function validateRoadmap(r) {
  const errors = [];
  if (!r || typeof r !== 'object') return { valid: false, errors: ['roadmap is not an object'] };

  if (!norm(r.skillName)) errors.push('skillName missing or empty');
  if (!Number.isInteger(r.popularityRank) || r.popularityRank < 1) {
    errors.push('popularityRank must be a positive integer');
  }

  if (!Array.isArray(r.subtopics)) {
    errors.push('subtopics must be an array');
  } else {
    if (r.subtopics.length < MIN_SUBTOPICS || r.subtopics.length > MAX_SUBTOPICS) {
      errors.push(`subtopics count ${r.subtopics.length} outside ${MIN_SUBTOPICS}-${MAX_SUBTOPICS}`);
    }
    if (r.subtopics.some(s => !norm(s))) {
      errors.push('subtopics contains an empty or non-string entry');
    }
    const seen = new Set();
    const dupes = new Set();
    for (const s of r.subtopics) {
      const n = norm(s);
      if (n && seen.has(n)) dupes.add(n);
      seen.add(n);
    }
    if (dupes.size) errors.push(`duplicate subtopics: ${[...dupes].join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

// Validate the whole set. `expectedSkills` (optional) = canonical skill names that
// must all be covered. Returns { valid, errors[], count }.
function validateRoadmapSet(roadmaps, expectedSkills) {
  if (!Array.isArray(roadmaps)) return { valid: false, errors: ['roadmaps must be an array'], count: 0 };
  const errors = [];

  for (const r of roadmaps) {
    const v = validateRoadmap(r);
    if (!v.valid) errors.push(`${(r && r.skillName) || '??'}: ${v.errors.join('; ')}`);
  }

  const names = roadmaps.map(r => norm(r && r.skillName));
  const nameSeen = new Set();
  const nameDupes = new Set();
  for (const n of names) {
    if (n && nameSeen.has(n)) nameDupes.add(n);
    nameSeen.add(n);
  }
  if (nameDupes.size) errors.push(`duplicate skillNames: ${[...nameDupes].join(', ')}`);

  const ranks = roadmaps.map(r => r && r.popularityRank).filter(n => Number.isInteger(n));
  if (new Set(ranks).size !== ranks.length) errors.push('popularityRank values are not unique');
  const sortedRanks = [...new Set(ranks)].sort((a, b) => a - b);
  if (!sortedRanks.every((v, i) => v === i + 1)) errors.push('popularityRank is not a contiguous 1..N sequence');

  if (Array.isArray(expectedSkills)) {
    const have = new Set(names);
    const missing = expectedSkills.filter(s => !have.has(norm(s)));
    if (missing.length) {
      errors.push(`missing roadmaps for ${missing.length} skill(s): ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', ...' : ''}`);
    }
  }

  return { valid: errors.length === 0, errors, count: roadmaps.length };
}

module.exports = { validateRoadmap, validateRoadmapSet, MIN_SUBTOPICS, MAX_SUBTOPICS };
