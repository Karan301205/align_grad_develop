#!/usr/bin/env node
/**
 * Merge authored/recovered interview MCQs into the Phase 3 question bank.
 * Self-contained (validator + buildRow inlined) after the earlier scripts were lost.
 *
 *   node scripts/haikuMerge.js <file-or-dir> [--source=haiku] [--replace]
 *
 * Input may be a single JSON-array file OR a directory of per-subtopic JSON-array files.
 * Guarantees: each MCQ validated (4 distinct options, correctIndex 0-3, explanation,
 * allowed difficulty), dedup on normalized question text within a skill, cap 10/subtopic,
 * full metadata + zeroed counters. Writes ONLY local questionBank.json — no database.
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'output');
const OUT_FILE = path.join(OUT_DIR, 'questionBank.json');
const ROADMAPS = path.join(OUT_DIR, 'roadmaps.json');
const TARGET = 10;
const ALLOWED_DIFFICULTY = new Set(['Medium', 'Medium-Hard', 'Hard']);

const normalizeText = s => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const keyOf = (skill, sub) => `${String(skill).toLowerCase()}||${String(sub).toLowerCase()}`;

function validateQuestion(q, ctx = {}) {
  const errors = [];
  if (!q || typeof q !== 'object') return { valid: false, errors: ['not an object'] };
  if (typeof q.question !== 'string' || !q.question.trim()) errors.push('question text missing');
  if (!Array.isArray(q.options) || q.options.length !== 4) errors.push('must have exactly 4 options');
  else {
    if (q.options.some(o => typeof o !== 'string' || !o.trim())) errors.push('empty/non-string option');
    if (new Set(q.options.map(normalizeText)).size !== 4) errors.push('duplicate options');
  }
  if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) errors.push('correctIndex must be 0-3');
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) errors.push('explanation missing');
  if (!ALLOWED_DIFFICULTY.has(q.difficulty)) errors.push(`bad difficulty "${q.difficulty}"`);
  if (ctx.skillName && q.skillName && normalizeText(q.skillName) !== normalizeText(ctx.skillName)) errors.push('skill mismatch');
  if (ctx.subtopic && q.subtopic && normalizeText(q.subtopic) !== normalizeText(ctx.subtopic)) errors.push('subtopic mismatch');
  return { valid: errors.length === 0, errors };
}

function buildRow(skillName, subtopic, popularityRank, raw, source) {
  return {
    skillName, subtopic, popularityRank,
    difficulty: raw.difficulty,
    question: String(raw.question).trim(),
    options: raw.options.map(o => String(o).trim()),
    correctIndex: raw.correctIndex,
    explanation: String(raw.explanation).trim(),
    tags: Array.isArray(raw.tags) ? raw.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 6) : [],
    version: 1, status: 'ACTIVE', source: `bank-${source}`,
    usageCount: 0, correctCount: 0, wrongCount: 0, skipCount: 0,
    lastUsed: null, lastReviewed: null, lastRegenerated: null,
    generatedAt: new Date().toISOString(),
  };
}

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

function main() {
  const inFile = process.argv[2];
  const sourceArg = (process.argv.find(a => a.startsWith('--source=')) || '--source=haiku').split('=')[1];
  const replace = process.argv.includes('--replace');
  if (!inFile) { console.error('usage: node scripts/haikuMerge.js <file-or-dir> [--source=haiku] [--replace]'); process.exit(1); }

  const resolved = path.resolve(inFile);
  let authored = [];
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    const files = fs.readdirSync(resolved).filter(f => f.endsWith('.json')).sort();
    for (const f of files) {
      const part = loadJson(path.join(resolved, f), null);
      if (Array.isArray(part)) authored.push(...part);
      else console.warn(`  skip (not an array): ${f}`);
    }
    console.log(`  loaded ${authored.length} questions from ${files.length} file(s) in ${inFile}`);
  } else {
    authored = loadJson(resolved, null);
  }
  if (!Array.isArray(authored)) { console.error(`input ${inFile} is not a JSON array or dir of arrays`); process.exit(1); }

  const roadmaps = loadJson(ROADMAPS, []);
  const rankOf = new Map(roadmaps.map(r => [r.skillName.toLowerCase(), r.popularityRank]));

  const bank = loadJson(OUT_FILE, []);
  const bankByKey = new Map();
  const skillSeen = new Map();
  for (const q of bank) {
    const k = keyOf(q.skillName, q.subtopic);
    if (!bankByKey.has(k)) bankByKey.set(k, []);
    bankByKey.get(k).push(q);
    const sl = q.skillName.toLowerCase();
    if (!skillSeen.has(sl)) skillSeen.set(sl, new Set());
    skillSeen.get(sl).add(normalizeText(q.question));
  }

  if (replace) {
    const inputKeys = new Set(authored.map(r => keyOf(r.skillName, r.subtopic)).filter(k => k !== '||'));
    for (const k of inputKeys) {
      const rows = bankByKey.get(k) || [];
      const sl = k.split('||')[0];
      if (skillSeen.has(sl)) for (const r of rows) skillSeen.get(sl).delete(normalizeText(r.question));
      bankByKey.set(k, []);
    }
    console.log(`  --replace: cleared ${inputKeys.size} subtopic(s) before merge`);
  }

  let added = 0, invalid = 0, dup = 0, full = 0;
  const perSubtopic = new Map();
  const rejects = [];
  for (const raw of authored) {
    const skillName = String(raw.skillName || '').trim();
    const subtopic = String(raw.subtopic || '').trim();
    if (!skillName || !subtopic) { invalid++; continue; }
    const k = keyOf(skillName, subtopic);
    if (!bankByKey.has(k)) bankByKey.set(k, []);
    const rows = bankByKey.get(k);
    if (rows.filter(r => validateQuestion(r).valid).length >= TARGET) { full++; continue; }
    const v = validateQuestion(raw, { skillName, subtopic });
    if (!v.valid) { invalid++; rejects.push(`${skillName} / ${subtopic}: ${v.errors.join(', ')}`); continue; }
    const sl = skillName.toLowerCase();
    if (!skillSeen.has(sl)) skillSeen.set(sl, new Set());
    const norm = normalizeText(raw.question);
    if (skillSeen.get(sl).has(norm)) { dup++; continue; }
    const rank = rankOf.get(sl) != null ? rankOf.get(sl) : 9999;
    rows.push(buildRow(skillName, subtopic, rank, raw, sourceArg));
    skillSeen.get(sl).add(norm);
    added++;
    perSubtopic.set(k, (perSubtopic.get(k) || 0) + 1);
  }

  const flat = [];
  for (const rows of bankByKey.values()) for (const r of rows) flat.push(r);
  flat.sort((a, b) => (a.popularityRank - b.popularityRank) || a.subtopic.localeCompare(b.subtopic));
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(flat, null, 2));

  console.log(`Merged ${inFile} (source=${sourceArg})`);
  console.log(`  added: ${added} | invalid: ${invalid} | duplicate: ${dup} | subtopic-already-full: ${full}`);
  for (const [k, n] of perSubtopic) {
    const total = bankByKey.get(k).filter(r => validateQuestion(r).valid).length;
    console.log(`    + ${k.replace('||', ' / ')}: +${n}  (now ${total}/10)`);
  }
  if (rejects.length) { console.log('  rejects:'); for (const r of rejects.slice(0, 20)) console.log(`    - ${r}`); }
  console.log(`  bank total: ${flat.length} MCQs`);
}

if (require.main === module) main();
module.exports = { main, validateQuestion, normalizeText, buildRow, keyOf };
