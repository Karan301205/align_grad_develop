const path = require('path');
const fs = require('fs');
const { prisma, isMock } = require('../db');

// Loads the pre-generated question bank into the IN-MEMORY MOCK at boot, so the
// local dev quiz works end-to-end with zero database setup. Hard safety guard:
// this is a no-op unless the mock client is active — it must never write to a
// real database. Idempotent within a process (skips if already loaded).
async function loadQuestionBankIntoMock() {
  if (typeof isMock !== 'function' || isMock() !== true) return; // mock only — never a real DB

  const file = path.join(__dirname, '../../../scripts/output/questionBank.json');
  if (!fs.existsSync(file)) {
    console.warn('[question-bank] no scripts/output/questionBank.json — generate the bank first');
    return;
  }

  let rows;
  try {
    rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.warn('[question-bank] could not parse questionBank.json:', err.message);
    return;
  }
  if (!Array.isArray(rows) || rows.length === 0) return;

  if ((await prisma.question.count()) > 0) return; // already loaded this process

  await prisma.question.createMany({ data: rows });
  const all = await prisma.question.findMany();
  const skills = new Set(all.map((q) => q.skillName));
  console.log(`[question-bank] loaded ${all.length} questions into mock across ${skills.size} skills`);
}

module.exports = { loadQuestionBankIntoMock };
