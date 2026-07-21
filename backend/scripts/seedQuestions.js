#!/usr/bin/env node
/**
 * Seed the temporary MCQ bank from scripts/output/questions.json into the
 * `Question` collection.
 *
 *   node scripts/seedQuestions.js            # DRY RUN — validates + prints counts, writes nothing
 *   node scripts/seedQuestions.js --commit   # writes to the database in DATABASE_URL
 *
 * Idempotent: on --commit it replaces existing rows for each skill present in the
 * file (deleteMany by skillName, then insert), so re-running does not duplicate.
 *
 * SAFETY: with DATABASE_URL pointing at production, --commit writes to production.
 * The agent never runs --commit; a human runs it after a backup. With DATABASE_URL
 * unset/localhost this hits the in-memory mock (nothing persists across processes).
 */
const fs = require('fs');
const path = require('path');

const OUT_FILE = path.join(__dirname, 'output', 'questions.json');

function loadAndValidate(file = OUT_FILE) {
  if (!fs.existsSync(file)) {
    throw new Error(`Question file not found: ${file}. Run: node scripts/generateQuestions.js`);
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(raw)) throw new Error('questions.json is not an array');

  const valid = [];
  const invalid = [];
  for (const q of raw) {
    const ok = q && typeof q.skillName === 'string' && typeof q.subtopic === 'string'
      && typeof q.question === 'string' && q.question.trim()
      && Array.isArray(q.options) && q.options.length === 4
      && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3;
    if (ok) {
      valid.push({
        skillName: q.skillName,
        subtopic: q.subtopic,
        question: q.question.trim(),
        options: q.options.map(String),
        correctIndex: q.correctIndex,
        source: q.source || 'temp-bank-groq',
      });
    } else {
      invalid.push(q);
    }
  }
  return { valid, invalid };
}

function summarize(rows) {
  const bySkill = {};
  for (const q of rows) bySkill[q.skillName] = (bySkill[q.skillName] || 0) + 1;
  return bySkill;
}

// Exported so the e2e test can drive it against the mock in one process.
async function run({ commit = false, file = OUT_FILE, prismaClient } = {}) {
  const prisma = prismaClient || require('../src/config/db').prisma;
  const { valid, invalid } = loadAndValidate(file);
  const bySkill = summarize(valid);

  console.log('=== Question bank seed ===');
  for (const [s, n] of Object.entries(bySkill)) console.log(`  ${s}: ${n}`);
  console.log(`  VALID: ${valid.length}   INVALID (skipped): ${invalid.length}`);

  if (!commit) {
    console.log('\nDRY RUN — nothing written. Re-run with --commit to write.');
    return { wrote: 0, skills: Object.keys(bySkill).length, valid: valid.length, invalid: invalid.length };
  }

  const skills = Object.keys(bySkill);
  let wrote = 0;
  for (const skill of skills) {
    await prisma.question.deleteMany({ where: { skillName: skill } });
    const rows = valid.filter(q => q.skillName === skill);
    const res = await prisma.question.createMany({ data: rows });
    wrote += (res && typeof res.count === 'number') ? res.count : rows.length;
  }
  console.log(`\nCOMMITTED: ${wrote} questions across ${skills.length} skills.`);
  return { wrote, skills: skills.length, valid: valid.length, invalid: invalid.length };
}

module.exports = { run, loadAndValidate, summarize };

if (require.main === module) {
  const commit = process.argv.includes('--commit');
  run({ commit })
    .then(() => process.exit(0))
    .catch((err) => { console.error('Seed failed:', err.message); process.exit(1); });
}
