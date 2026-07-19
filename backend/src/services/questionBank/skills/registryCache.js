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
const { buildAliasIndex, resolveSkill } = require('./normalize');

let aliasIndex = null;

async function load() {
  const definitions = await repo.findAll();
  aliasIndex = buildAliasIndex(definitions);
  console.log(`[skill-registry] loaded ${aliasIndex.size} skill spellings`);
}

function isLoaded() {
  return aliasIndex !== null;
}

function resolve(rawName) {
  if (!aliasIndex) return rawName;
  return resolveSkill(aliasIndex, rawName) || rawName;
}

// Test seam: populate the index without a database.
function _setForTesting(definitions) {
  aliasIndex = definitions === null ? null : buildAliasIndex(definitions);
}

module.exports = { load, isLoaded, resolve, _setForTesting };
