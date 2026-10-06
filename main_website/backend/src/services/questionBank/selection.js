// Phase 4 question-selection engine. PURE (no I/O): the caller fetches the ACTIVE
// question pool for a skill and passes it in; this module decides which to serve.
//
// Goals (per Phase 4):
//   - distribute across subtopics rather than drawing from one area
//   - keep a balanced difficulty distribution per the assessment config
//   - never repeat a question within one assessment
//   - be DETERMINISTIC given a seed (so it is testable and reproducible) while
//     still varying between assessments in production (a random seed is used there)
//
// Extensible: selection behaviour is driven by `config` (count + difficultyMix),
// so future versions can tune the mix without touching call sites.

const DEFAULT_DIFFICULTY_MIX = { Medium: 4, 'Medium-Hard': 3, Hard: 3 }; // sums to 10

// Small, fast, seedable PRNG (mulberry32). Deterministic for a given seed.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Derive a 32-bit seed from a string (stable across runs).
function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Fisher-Yates using a provided rng() in [0,1). Returns a new array.
function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Usage-aware ordering (Phase 5): least-used first, with a seeded-random tiebreak
// among equally-used questions so traffic spreads naturally instead of always
// hitting the same low-usage rows. Returns a new array.
function orderByUsage(arr, rng) {
  return arr
    .map((q) => ({ q, u: q.usageCount || 0, t: rng() }))
    .sort((a, b) => (a.u - b.u) || (a.t - b.t))
    .map((x) => x.q);
}

// Scale a difficultyMix (relative weights) to exactly `count` slots.
function scaleMix(mix, count) {
  const entries = Object.entries(mix).filter(([, w]) => w > 0);
  const totalW = entries.reduce((s, [, w]) => s + w, 0) || 1;
  const quota = {};
  let assigned = 0;
  for (const [d, w] of entries) {
    quota[d] = Math.floor((w / totalW) * count);
    assigned += quota[d];
  }
  // distribute any remainder to the highest-weight difficulties first
  const order = entries.sort((a, b) => b[1] - a[1]).map(([d]) => d);
  let i = 0;
  while (assigned < count && order.length) {
    quota[order[i % order.length]] = (quota[order[i % order.length]] || 0) + 1;
    assigned++; i++;
  }
  return quota;
}

/**
 * Select `count` distinct questions from `pool`, spread across subtopics and
 * balanced by difficulty. Deterministic for a given `seed`.
 *
 * @param {Array} pool  ACTIVE question rows (must have id, subtopic, difficulty)
 * @param {Object} config { count=10, difficultyMix, seed }
 * @returns {Array} selected rows (subset of pool), length <= count, no duplicates
 */
function selectQuestions(pool, config = {}) {
  const count = config.count || 10;
  const mix = config.difficultyMix || DEFAULT_DIFFICULTY_MIX;
  const seed = config.seed != null
    ? (typeof config.seed === 'string' ? hashSeed(config.seed) : config.seed >>> 0)
    : (Math.floor(Math.random() * 0xffffffff) >>> 0);
  const rng = mulberry32(seed);

  const items = Array.isArray(pool) ? pool.filter((q) => q && q.id != null) : [];
  if (items.length === 0) return [];

  // Group into per-subtopic queues, shuffled; subtopic visiting order shuffled too.
  const bySubtopic = new Map();
  for (const q of items) {
    const key = q.subtopic || '__none__';
    if (!bySubtopic.has(key)) bySubtopic.set(key, []);
    bySubtopic.get(key).push(q);
  }
  const subtopics = seededShuffle([...bySubtopic.keys()], rng);
  // Within each subtopic, least-used first (seeded tiebreak) so selection favours
  // under-served questions while the round-robin below keeps subtopic spread.
  for (const k of subtopics) bySubtopic.set(k, orderByUsage(bySubtopic.get(k), rng));

  const quota = scaleMix(mix, Math.min(count, items.length));
  const picked = [];
  const usedIds = new Set();

  const takeFromSubtopic = (queue, preferDifficulty) => {
    // prefer a question matching an unmet difficulty quota; else take the first unused
    if (preferDifficulty) {
      const idx = queue.findIndex((q) => !usedIds.has(q.id) && q.difficulty === preferDifficulty);
      if (idx !== -1) return queue.splice(idx, 1)[0];
      return null;
    }
    const idx = queue.findIndex((q) => !usedIds.has(q.id));
    return idx !== -1 ? queue.splice(idx, 1)[0] : null;
  };

  // Round-robin across subtopics for even spread; within each turn prefer a
  // difficulty that still has remaining quota so the mix stays balanced.
  let guard = 0;
  const maxGuard = items.length * 2 + 10;
  while (picked.length < count && guard++ < maxGuard) {
    let progressed = false;
    for (const k of subtopics) {
      if (picked.length >= count) break;
      const queue = bySubtopic.get(k);
      if (!queue || queue.length === 0) continue;

      const wanted = Object.keys(quota).find((d) => quota[d] > 0);
      let q = wanted ? takeFromSubtopic(queue, wanted) : null;
      if (!q) q = takeFromSubtopic(queue, null); // no preferred-difficulty match here → any
      if (!q) continue;

      usedIds.add(q.id);
      picked.push(q);
      if (quota[q.difficulty] > 0) quota[q.difficulty]--;
      progressed = true;
    }
    if (!progressed) break; // pool exhausted
  }

  return picked;
}

module.exports = {
  selectQuestions,
  seededShuffle,
  orderByUsage,
  mulberry32,
  hashSeed,
  scaleMix,
  DEFAULT_DIFFICULTY_MIX,
};
