#!/usr/bin/env node
/**
 * Verify the integrity of the persisted Question Bank (Phase 6).
 *
 *   node scripts/verifyQuestionBank.js            # verify DB (prisma.question)
 *   node scripts/verifyQuestionBank.js --file     # verify scripts/output/questionBank.json instead
 *
 * Read-only. Canonical skills come from skills/seedData.json (registry) and
 * roadmaps from scripts/output/roadmaps.json. Produces a detailed report and
 * exits non-zero if any integrity check fails.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { prisma, isMock } = require('../src/config/db');
const { buildAliasIndex, resolveSkill } = require('../src/services/questionBank/skills/normalize');
const { normalizeText } = require('../src/services/questionBank/question/validate');

const seedData = require('../src/services/questionBank/skills/seedData.json');
const roadmaps = require('./output/roadmaps.json');
const ALLOWED_DIFFICULTY = new Set(['Medium', 'Medium-Hard', 'Hard']);
const VALID_REVIEW_STATES = new Set(['NONE', 'NEEDS_REVIEW', 'REPLACEMENT_CANDIDATE']);
const log = (...a) => console.log('[qbank-verify]', ...a);

async function main() {
  const useFile = process.argv.includes('--file');
  const questions = useFile
    ? JSON.parse(fs.readFileSync(path.join(__dirname, 'output', 'questionBank.json'), 'utf8'))
    : await prisma.question.findMany({ select: { id: true, skillName: true, subtopic: true, question: true, options: true, correctIndex: true, explanation: true, difficulty: true, reviewState: true, status: true } });

  log(`source: ${useFile ? 'questionBank.json' : (isMock() ? 'MOCK DB' : 'REAL DB')} | questions: ${questions.length}`);

  const aliasIndex = buildAliasIndex(seedData);
  const roadmapBySkill = new Map(roadmaps.map((r) => [r.skillName.toLowerCase(), new Set(r.subtopics.map((s) => s.toLowerCase()))]));

  const checks = []; // { name, failures: [] }
  const add = (name, failures) => checks.push({ name, count: failures.length, sample: failures.slice(0, 5) });

  const orphanSkill = [], noRoadmap = [], badSubtopic = [], missingMeta = [], badDifficulty = [], badReview = [], dupIds = [];
  const dupInSubtopic = [];
  const idSeen = new Set();
  const subtopicText = new Map(); // skill||subtopic -> Set(normalized question)
  const skillsWithQuestions = new Set();
  let retiredCount = 0;

  for (const q of questions) {
    const skillL = String(q.skillName || '').toLowerCase();
    const isRetired = q.status === 'RETIRED';
    const label = `${q.skillName}/${q.subtopic}`;

    // Roadmap-alignment checks apply to servable questions only. RETIRED rows are
    // archived (kept for history) and intentionally exempt from roadmap coverage.
    if (isRetired) { retiredCount++; }
    else {
      skillsWithQuestions.add(skillL);
      // valid canonical skill (registry resolves the name)
      if (!resolveSkill(aliasIndex, q.skillName)) orphanSkill.push(label);
      // roadmap exists for the skill
      const subs = roadmapBySkill.get(skillL);
      if (!subs) noRoadmap.push(q.skillName);
      else if (!subs.has(String(q.subtopic || '').toLowerCase())) badSubtopic.push(label); // subtopic not in roadmap
    }

    // metadata completeness
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
        !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3 ||
        typeof q.explanation !== 'string') missingMeta.push(label);

    // difficulty + reviewState
    if (!ALLOWED_DIFFICULTY.has(q.difficulty)) badDifficulty.push(`${label} (${q.difficulty})`);
    if (q.reviewState != null && !VALID_REVIEW_STATES.has(q.reviewState)) badReview.push(`${label} (${q.reviewState})`);

    // duplicate ids (DB only)
    if (q.id != null) { if (idSeen.has(q.id)) dupIds.push(String(q.id)); else idSeen.add(q.id); }

    // duplicate question within subtopic
    const key = `${skillL}||${String(q.subtopic).toLowerCase()}`;
    if (!subtopicText.has(key)) subtopicText.set(key, new Set());
    const norm = normalizeText(q.question);
    if (subtopicText.get(key).has(norm)) dupInSubtopic.push(label);
    else subtopicText.get(key).add(norm);
  }

  add('orphaned questions (skill not in canonical registry)', orphanSkill);
  add('questions whose skill has no roadmap', noRoadmap);
  add('questions whose subtopic is not in its roadmap', badSubtopic);
  add('questions with missing/invalid metadata', missingMeta);
  add('invalid difficulty values', badDifficulty);
  add('invalid review states', badReview);
  add('duplicate Question IDs', dupIds);
  add('duplicate questions within a subtopic', dupInSubtopic);

  // coverage: skills present vs roadmaps
  const skillsCovered = [...skillsWithQuestions].filter((s) => roadmapBySkill.has(s)).length;

  log('\n===== INTEGRITY REPORT =====');
  log(`questions: ${questions.length} (active ${questions.length - retiredCount}, retired ${retiredCount}) | distinct skills with questions: ${skillsWithQuestions.size} | roadmaps available: ${roadmaps.length} | canonical skills: ${seedData.length}`);
  log(`skills-with-questions that have a roadmap: ${skillsCovered}/${skillsWithQuestions.size}`);
  let failed = 0;
  for (const c of checks) {
    const ok = c.count === 0;
    if (!ok) failed++;
    log(`  ${ok ? '✓' : '✗'} ${c.name}: ${c.count}${ok ? '' : ' — e.g. ' + c.sample.join(', ')}`);
  }
  log('============================');
  if (failed) { log(`RESULT: ${failed} check(s) FAILED`); process.exitCode = 4; }
  else log('RESULT: ALL INTEGRITY CHECKS PASSED ✓');
}

if (require.main === module) {
  main().then(() => process.exit(process.exitCode || 0)).catch((e) => { console.error('[qbank-verify] failed:', e.stack || e.message); process.exit(1); });
}
module.exports = { main };
