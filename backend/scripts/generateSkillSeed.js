// ONE-TIME importer: parses frontend ALL_SKILLS into a committed seed file.
// Run:  node scripts/generateSkillSeed.js
//
// The frontend list is ESM in a separate npm project, so it is parsed as text
// rather than imported. After the registry is seeded, the database is the
// source of truth and this script should not need to run again.

const fs = require('fs');
const path = require('path');
const { normalizeToken, buildAliasIndex } = require('../src/services/questionBank/skills/normalize');

const FRONTEND_SKILLS = path.join(__dirname, '../../frontend/src/constants/skills.js');
const OUTPUT = path.join(__dirname, '../src/services/questionBank/skills/seedData.json');

// Popularity tiers drive generation order. Everything unlisted defaults to 3.
// NOTE: 'Git and Github' and 'Express JS' below are spelled to match the
// exact casing used in frontend/src/constants/skills.js (lines 65 and 57
// respectively), not the brief's original casing ('Git and GitHub' /
// 'Express js'). tierFor() below does an exact-string match, so the brief's
// casing silently failed to match and dropped both out of their tiers.
const TIER_1 = [
  'Python', 'Java', 'JavaScript', 'React', 'Node.js',
  'SQL', 'Git and Github', 'Docker', 'AWS',
];
const TIER_2 = [
  'Redis', 'MongoDB', 'Linux', 'TypeScript', 'Express JS', 'Next.js', 'Kubernetes',
];
const TIER_3_EXPLICIT = [
  'Rust', 'Terraform', 'Kafka', 'ElasticSearch', 'Go', 'GraphQL',
];

// Canonical name -> spellings that must fold into it. These are SEMANTIC merges
// that no string rule could infer; punctuation variants are handled by
// normalizeToken and must NOT be listed here.
const MERGES = {
  'Matplotlib & Seaborn': ['Matplotlib', 'Seaborn'],
  'Data Structures & Algorithms': ['Data Structure'],
  'Agile Methodologies': ['Agile Principles & Scrum'],
  'Generative AI': ['GenAI'],
};

// Tier-listed skills absent from the frontend list must still get registry rows.
// 'Matplotlib & Seaborn' is here for the same reason: it is a MERGES canonical
// (merge target) that, unlike the other 3 merge targets, never appears as its
// own literal entry in the frontend list — only its two aliases ('Matplotlib',
// 'Seaborn') do, and those get absorbed away below. Without adding the
// canonical name here too, `names` would never contain it and the merge
// group would silently vanish instead of producing a row.
const EXTRA_SKILLS = ['Redis', 'GraphQL', 'Matplotlib & Seaborn'];

function parseFrontendSkills(source) {
  const entries = [];
  const re = /\{\s*skill:\s*"((?:[^"\\]|\\.)*)"\s*,\s*type:\s*"(technical|non-technical)"\s*\}/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    entries.push({ skill: match[1].replace(/\\"/g, '"'), type: match[2] });
  }
  return entries;
}

function slugify(canonicalName) {
  return normalizeToken(canonicalName)
    .replace(/\+/g, '-plus')
    .replace(/#/g, '-sharp')
    .replace(/\s+/g, '-');
}

function tierFor(canonicalName) {
  if (TIER_1.includes(canonicalName)) return 1;
  if (TIER_2.includes(canonicalName)) return 2;
  return 3;
}

function main() {
  const source = fs.readFileSync(FRONTEND_SKILLS, 'utf8');
  const parsed = parseFrontendSkills(source);

  if (parsed.length === 0) {
    throw new Error('Parsed zero skills from the frontend list — the file format changed.');
  }

  const technical = parsed.filter((e) => e.type === 'technical').map((e) => e.skill);
  const rawNames = [...new Set([...technical, ...EXTRA_SKILLS])];

  // The parser matches text, not live JS — it does not skip commented-out
  // entries in the frontend source. That occasionally surfaces a pure
  // punctuation-variant duplicate of an already-live entry (e.g. a commented
  // "Next JS" alongside the live "Next.js"). normalizeToken() is exactly the
  // mechanism this system uses to recognize such variants as the same skill,
  // so collapse them here (first occurrence wins). This must happen BEFORE
  // the MERGES/absorbed step below: if a canonical name and its own
  // duplicate normalize identically, adding the duplicate as a MERGES alias
  // would delete the canonical too (its normalized token is also "absorbed").
  const seenTokens = new Set();
  const duplicateSpellings = [];
  const names = [];
  for (const name of rawNames) {
    const token = normalizeToken(name);
    if (seenTokens.has(token)) {
      duplicateSpellings.push(name);
      continue;
    }
    seenTokens.add(token);
    names.push(name);
  }

  // Names that are merged INTO another canonical must not become rows themselves.
  const absorbed = new Set(Object.values(MERGES).flat().map(normalizeToken));

  const definitions = names
    .filter((name) => !absorbed.has(normalizeToken(name)))
    .map((canonicalName) => ({
      canonicalName,
      slug: slugify(canonicalName),
      aliases: MERGES[canonicalName] || [],
      category: 'technical',
      tier: tierFor(canonicalName),
      targetQuestionCount: 300,
    }))
    .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));

  // Fail loudly on duplicate slugs or alias collisions before writing anything.
  const slugs = new Set();
  for (const def of definitions) {
    if (slugs.has(def.slug)) {
      throw new Error(`Duplicate slug "${def.slug}" for "${def.canonicalName}"`);
    }
    slugs.add(def.slug);
  }
  buildAliasIndex(definitions); // throws on collision

  fs.writeFileSync(OUTPUT, JSON.stringify(definitions, null, 2) + '\n');

  const byTier = definitions.reduce((acc, d) => {
    acc[d.tier] = (acc[d.tier] || 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${definitions.length} skill definitions to ${OUTPUT}`);
  console.log(`  Tier 1: ${byTier[1] || 0}  Tier 2: ${byTier[2] || 0}  Tier 3: ${byTier[3] || 0}`);
  console.log(`  Merged away: ${[...absorbed].join(', ')}`);
  if (duplicateSpellings.length) {
    console.log(`  Collapsed duplicate spellings (punctuation-only variants of a live entry): ${duplicateSpellings.join(', ')}`);
  }
}

main();
