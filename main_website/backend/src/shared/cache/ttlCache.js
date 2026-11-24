// Small in-process cache with a time limit, for data many requests read and that may be
// a few seconds old (the open-job list, a shared job page, candidates' skills for the
// recruiter count). Each server process keeps its own copy: an entry expires after its
// `ttlMs`, and `invalidate(prefix)` drops this process's entries at once after a write.
//
// Concurrent misses for the same key share one load, so an expired entry under load
// costs one database query, not one per waiting request.
//
// Never put per-user private data or answer keys in here: cached values are shared by
// every caller, and callers must not modify them.

const MAX_ENTRIES = 1000;

const entries = new Map(); // key -> { value, expires }
const loading = new Map(); // key -> Promise of the value being loaded
let generation = 0; // bumped by invalidate(), so a load that started before it isn't stored

async function cached(key, ttlMs, load) {
  const hit = entries.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  if (loading.has(key)) return loading.get(key);

  const startedIn = generation;
  const pending = (async () => {
    try {
      const value = await load();
      if (startedIn === generation) {
        entries.delete(key);
        if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value); // drop the oldest
        entries.set(key, { value, expires: Date.now() + ttlMs });
      }
      return value;
    } finally {
      loading.delete(key);
    }
  })();
  loading.set(key, pending);
  return pending;
}

/** Drops every entry whose key starts with `prefix` (all entries when it's empty). */
function invalidate(prefix = '') {
  generation += 1;
  for (const key of entries.keys()) {
    if (key.startsWith(prefix)) entries.delete(key);
  }
}

module.exports = { cached, invalidate };
