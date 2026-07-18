// Pure skill-name normalization. No I/O, no Prisma — safe to unit test directly.
//
// Two mechanisms work together and neither subsumes the other:
//   1. normalizeToken() folds PUNCTUATION variants  ("Next.js" === "next js")
//   2. explicit aliases fold SEMANTIC variants      ("Data Structure" -> "Data Structures & Algorithms")
//
// `+` and `#` are deliberately preserved: C, C++ and C# are distinct skills.

const PUNCTUATION = /[._\-/&,()]+/g;
const WHITESPACE = /\s+/g;

function normalizeToken(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    .replace(PUNCTUATION, ' ')
    .replace(WHITESPACE, ' ')
    .trim();
}

// Builds a lookup from every known spelling to its canonical name.
// Throws on genuine collisions so bad seed data fails loudly at boot rather
// than silently routing two skills to one bank.
function buildAliasIndex(definitions) {
  const index = new Map();

  for (const def of definitions) {
    const spellings = [def.canonicalName, ...(def.aliases || [])];

    for (const spelling of spellings) {
      const key = normalizeToken(spelling);
      if (!key) continue;

      const existing = index.get(key);
      if (existing && existing !== def.canonicalName) {
        throw new Error(
          `Skill alias collision: "${spelling}" maps to both "${existing}" and "${def.canonicalName}"`
        );
      }
      index.set(key, def.canonicalName);
    }
  }

  return index;
}

function resolveSkill(aliasIndex, rawName) {
  const key = normalizeToken(rawName);
  if (!key) return null;
  return aliasIndex.get(key) || null;
}

module.exports = { normalizeToken, buildAliasIndex, resolveSkill };
