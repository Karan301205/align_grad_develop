// Boot-time cached alias index for the hot job-matching path.
//
// The registry only changes when an operator seeds it, so a single load at
// startup (with an explicit reload) avoids a database round trip per skill
// comparison in skillMatching.service.js.
//
// FAILURE MODE: if the cache is not loaded, resolve() returns the input
// unchanged rather than null. An unseeded registry must degrade to today's
// behaviour, not silently fail every job match.

const repo = require('../repositories/skillDefinitionRepository');
const { buildAliasIndex, resolveSkill, normalizeToken } = require('./normalize');

let aliasIndex = null;
let spellingsByCanonical = null; // canonical name -> every normalized spelling that resolves to it

function indexSpellings(index) {
  const byCanonical = new Map();
  for (const [key, canonical] of index) {
    if (!byCanonical.has(canonical)) byCanonical.set(canonical, new Set());
    byCanonical.get(canonical).add(key);
  }
  return byCanonical;
}

async function load() {
  const definitions = await repo.findAll();
  aliasIndex = buildAliasIndex(definitions);
  spellingsByCanonical = indexSpellings(aliasIndex);
  console.log(`[skill-registry] loaded ${aliasIndex.size} skill spellings`);
}

function isLoaded() {
  return aliasIndex !== null;
}

function resolve(rawName) {
  if (!aliasIndex) return rawName;
  return resolveSkill(aliasIndex, rawName) || rawName;
}

/**
 * Every normalized spelling (normalizeToken) of the skill `rawName` resolves to: its own, its
 * canonical name's and the registry aliases'. Recruiter search matches CandidateSkill.normKey
 * against these, so "Next.js", "next js" and a registered alias find the same candidates.
 */
function spellingsOf(rawName) {
  const canonical = resolve(rawName);
  const keys = new Set([normalizeToken(rawName), normalizeToken(canonical)]);
  (spellingsByCanonical?.get(canonical) || []).forEach((key) => keys.add(key));
  keys.delete('');
  return [...keys];
}

// Test seam: populate the index without a database.
function _setForTesting(definitions) {
  aliasIndex = definitions === null ? null : buildAliasIndex(definitions);
  spellingsByCanonical = aliasIndex ? indexSpellings(aliasIndex) : null;
}

module.exports = { load, isLoaded, resolve, spellingsOf, _setForTesting };
