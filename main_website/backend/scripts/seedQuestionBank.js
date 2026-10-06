#!/usr/bin/env node
/**
 * Seed the pre-generated Question Bank into the database (Phase 6).
 *
 *   node scripts/seedQuestionBank.js            # DRY RUN — validates + reports, writes nothing
 *   node scripts/seedQuestionBank.js --commit   # actually persist (HUMAN-run against prod)
 *   node scripts/seedQuestionBank.js --batch=200
 *
 * Guarantees:
 *   - Dry-run by default; --commit required for any write.
 *   - Validates EVERY record before inserting; aborts on invalid data (nothing written).
 *   - Idempotent + resumable: skips questions already present (matched by
 *     skillName+subtopic+question text), so re-running continues where it left off.
 *   - Detailed per-skill logs.
 *   - Graceful rollback: if an unrecoverable error occurs mid-commit, the rows
 *     inserted BY THIS RUN are deleted, leaving the DB as it was before.
 *
 * SAFETY: writes to whatever DATABASE_URL points at. Against production this is a
 * deliberate human step — never run --commit from an automated agent.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { prisma, isMock } = require('../src/config/db');
const { validateQuestion, normalizeText, ALLOWED_DIFFICULTY } = require('../src/services/questionBank/question/validate');

const BANK_FILE = path.join(__dirname, 'output', 'questionBank.json');
const VALID_REVIEW_STATES = new Set(['NONE', 'NEEDS_REVIEW', 'REPLACEMENT_CANDIDATE']);
const log = (...a) => console.log('[qbank-seed]', ...a);
const err = (...a) => console.error('[qbank-seed]', ...a);

const contentKey = (q) => `${String(q.skillName).toLowerCase()}||${String(q.subtopic).toLowerCase()}||${normalizeText(q.question)}`;

// Strip to the columns the schema owns; force counters/review to clean defaults.
function toRow(q) {
  return {
    skillName: String(q.skillName).trim(),
    subtopic: String(q.subtopic).trim(),
    difficulty: q.difficulty,
    question: String(q.question).trim(),
    options: q.options.map((o) => String(o).trim()),
    correctIndex: q.correctIndex,
    explanation: String(q.explanation || '').trim(),
    tags: Array.isArray(q.tags) ? q.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 6) : [],
    version: q.version || 1,
    status: q.status && ['ACTIVE', 'RETIRED', 'FLAGGED'].includes(q.status) ? q.status : 'ACTIVE',
    reviewState: VALID_REVIEW_STATES.has(q.reviewState) ? q.reviewState : 'NONE',
    source: q.source || 'bank',
  };
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes('--commit');
  const batchSize = parseInt((args.find((a) => a.startsWith('--batch=')) || '--batch=200').split('=')[1], 10);

  log(`target DB: ${isMock() ? 'MOCK (in-memory)' : 'REAL (DATABASE_URL)'} | mode: ${commit ? 'COMMIT' : 'DRY RUN'}`);

  if (!fs.existsSync(BANK_FILE)) { err(`missing ${BANK_FILE}`); process.exit(1); }
  const bank = JSON.parse(fs.readFileSync(BANK_FILE, 'utf8'));
  if (!Array.isArray(bank) || !bank.length) { err('bank file empty or not an array'); process.exit(1); }
  log(`loaded ${bank.length} questions from questionBank.json`);

  // 1. Validate EVERY record up front. Abort before any write on invalid data.
  const invalid = [];
  for (let i = 0; i < bank.length; i++) {
    const q = bank[i];
    const v = validateQuestion(q);
    const reasons = v.valid ? [] : [...v.errors];
    if (!ALLOWED_DIFFICULTY.has(q.difficulty)) reasons.push(`bad difficulty "${q.difficulty}"`);
    if (q.reviewState != null && !VALID_REVIEW_STATES.has(q.reviewState)) reasons.push(`bad reviewState "${q.reviewState}"`);
    if (reasons.length) invalid.push({ i, skill: q.skillName, subtopic: q.subtopic, reasons });
  }
  if (invalid.length) {
    err(`VALIDATION FAILED — ${invalid.length} invalid record(s); nothing written. First 10:`);
    for (const bad of invalid.slice(0, 10)) err(`  #${bad.i} ${bad.skill}/${bad.subtopic}: ${bad.reasons.join(', ')}`);
    process.exit(2);
  }
  log('validation: all records valid ✓');

  // 2. Idempotency — skip questions already present (by content key). Resumable.
  // Read only the fields needed for the dedup key — avoids deserializing legacy
  // rows that may have null timestamps, and is far lighter than full rows.
  const existing = await prisma.question.findMany({ select: { skillName: true, subtopic: true, question: true } });
  const existingKeys = new Set(existing.map(contentKey)); // snapshot BEFORE any insert
  const existingCount = existingKeys.size;                // stable count (findMany may return a live ref under the mock)
  log(`existing questions in DB: ${existing.length}`);

  const seenThisFile = new Set();
  const toInsert = [];
  let dupInFile = 0;
  for (const q of bank) {
    const k = contentKey(q);
    if (existingKeys.has(k)) continue;      // already seeded → skip (resume)
    if (seenThisFile.has(k)) { dupInFile++; continue; } // guard against dup in file
    seenThisFile.add(k);
    toInsert.push(toRow(q));
  }

  const perSkill = {};
  for (const r of toInsert) perSkill[r.skillName] = (perSkill[r.skillName] || 0) + 1;
  log(`to insert: ${toInsert.length} | already present (skipped): ${bank.length - toInsert.length - dupInFile} | dup-in-file skipped: ${dupInFile}`);
  for (const [s, n] of Object.entries(perSkill).sort()) log(`   + ${s}: ${n}`);

  if (!toInsert.length) { log('nothing to insert — DB already up to date ✓'); return; }

  if (!commit) {
    log(`\nDRY RUN — no writes. Re-run with --commit to persist ${toInsert.length} questions.`);
    return;
  }

  // 3. Commit in batches with graceful rollback of THIS run on unrecoverable error.
  const insertedKeys = [];
  let inserted = 0;
  try {
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      await prisma.question.createMany({ data: batch });
      for (const r of batch) insertedKeys.push(contentKey(r));
      inserted += batch.length;
      log(`  committed ${inserted}/${toInsert.length}`);
    }
    log(`\nCOMMIT complete: ${inserted} questions inserted. DB total now ${existingCount + inserted}.`);
  } catch (e) {
    err(`UNRECOVERABLE ERROR after ${inserted} inserts: ${e.message}`);
    err('rolling back this run…');
    try {
      // Delete only rows THIS run inserted: content-keys we inserted that were not
      // present before the run. Leaves any pre-existing data untouched.
      const insertedSet = new Set(insertedKeys);
      let removed = 0;
      for (const q of await prisma.question.findMany({ select: { id: true, skillName: true, subtopic: true, question: true } })) {
        const k = contentKey(q);
        if (insertedSet.has(k) && !existingKeys.has(k)) {
          await prisma.question.deleteMany({ where: { id: q.id } });
          removed++;
        }
      }
      err(`rollback removed ${removed} rows — DB restored to pre-run state (${existingCount}).`);
    } catch (re) {
      err(`ROLLBACK FAILED: ${re.message}. Manual cleanup required. Inserted content-keys logged above.`);
    }
    process.exit(3);
  }
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch((e) => { err('seed failed:', e.stack || e.message); process.exit(1); });
}
module.exports = { main };
