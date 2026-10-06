#!/usr/bin/env node
/**
 * Load test the assessment flow under concurrent usage (Phase 6). Runs against
 * the MOCK DB by default (force with DATABASE_URL=''), simulating many candidates
 * taking assessments simultaneously. Verifies atomic counters, no duplicate
 * question selection within an assessment, no data corruption, and reports timing.
 *
 *   DATABASE_URL='' node scripts/loadTestQuestionBank.js [totalAssessments] [concurrency]
 *
 * NOTE: Node is single-threaded, so this exercises async interleaving + counting
 * correctness + latency, not OS-level parallelism. On real MongoDB, counter
 * updates use atomic $inc, which is race-safe across processes.
 */
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
const path = require('path');
const BE = __dirname + '/..';

function fakeRes() { const r = { statusCode: 200, body: null, status(c) { r.statusCode = c; return r; }, json(o) { r.body = o; return r; } }; return r; }
const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; };

(async () => {
  const total = parseInt(process.argv[2] || '200', 10);
  const concurrency = parseInt(process.argv[3] || '25', 10);
  const { prisma, isMock } = require(path.join(BE, 'src/config/db'));
  if (!isMock()) { console.error('[loadtest] refusing to run against a REAL DB'); process.exit(1); }
  await require(path.join(BE, 'src/config/mock/loadQuestionBankMock')).loadQuestionBankIntoMock();
  const controller = require(path.join(BE, 'src/controllers/student.controller'));

  const skills = ['Python', 'JavaScript', 'Java', 'Go', 'React'];
  // Candidates
  const candidates = [];
  for (let i = 0; i < 20; i++) {
    const u = await prisma.user.create({ data: { email: `c${i}@x.com`, role: 'STUDENT' } });
    await prisma.profile.create({ data: { userId: u.id, skills: skills.map((s) => ({ name: s, rating: 1, verifiedRating: 0 })) } });
    candidates.push(u.id);
  }

  const genTimes = [], subTimes = [];
  let dupWithinAssessment = 0, errors = 0, completed = 0;
  const expectedServes = { total: 0 }; // per skill count of served questions

  async function oneAssessment(n) {
    const uid = candidates[n % candidates.length];
    const skill = skills[n % skills.length];
    const req = (body) => ({ user: { id: uid }, body });
    try {
      let t = process.hrtime.bigint();
      const g = fakeRes(); await controller.generateSkillTest(req({ skillName: skill }), g);
      genTimes.push(Number(process.hrtime.bigint() - t) / 1e6);
      if (g.statusCode !== 200) { errors++; return; }
      const served = g.body.questions.map((q) => q.id);
      if (new Set(served).size !== served.length) dupWithinAssessment++;
      expectedServes[skill] = (expectedServes[skill] || 0) + g.body.questions.length;
      expectedServes.total += g.body.questions.length;

      const key = (await prisma.testSession.findUnique({ where: { id: g.body.sessionId } })).answerKey;
      const answers = key.map((k, i) => (i < 7 ? k : (i % 2 ? -1 : (k + 1) % 4)));
      t = process.hrtime.bigint();
      const s = fakeRes(); await controller.submitSkillTest(req({ sessionId: g.body.sessionId, answers }), s);
      subTimes.push(Number(process.hrtime.bigint() - t) / 1e6);
      if (s.statusCode !== 200) { errors++; return; }
      completed++;
    } catch (e) { errors++; console.error('[loadtest] error:', e.message); }
  }

  console.log(`[loadtest] ${total} assessments, concurrency ${concurrency}, ${candidates.length} candidates, ${skills.length} skills`);
  const start = Date.now();
  let idx = 0;
  while (idx < total) {
    const batch = [];
    for (let c = 0; c < concurrency && idx < total; c++, idx++) batch.push(oneAssessment(idx));
    await Promise.all(batch); // fire a wave concurrently
  }
  const wall = Date.now() - start;

  // --- integrity of counters after the run ---
  let sumUsage = 0, sumOutcomes = 0;
  for (const skill of skills) {
    const rows = await prisma.question.findMany({ where: { skillName: skill } });
    for (const q of rows) { sumUsage += q.usageCount; sumOutcomes += q.correctCount + q.wrongCount + q.skipCount; }
  }
  const recs = await prisma.assessmentRecord.count();

  console.log('\n===== LOAD TEST RESULTS =====');
  console.log(`completed: ${completed}/${total} | errors: ${errors} | wall: ${wall}ms | throughput: ${(completed / (wall / 1000)).toFixed(1)}/s`);
  console.log(`generate latency ms — avg ${(genTimes.reduce((a, b) => a + b, 0) / genTimes.length).toFixed(2)} p50 ${pct(genTimes, 50).toFixed(2)} p95 ${pct(genTimes, 95).toFixed(2)} max ${Math.max(...genTimes).toFixed(2)}`);
  console.log(`submit  latency ms — avg ${(subTimes.reduce((a, b) => a + b, 0) / subTimes.length).toFixed(2)} p50 ${pct(subTimes, 50).toFixed(2)} p95 ${pct(subTimes, 95).toFixed(2)} max ${Math.max(...subTimes).toFixed(2)}`);
  console.log(`duplicate-question-within-assessment: ${dupWithinAssessment} (want 0)`);
  console.log(`atomic counters — total usageCount ${sumUsage} == served ${expectedServes.total} ? ${sumUsage === expectedServes.total ? 'YES ✓' : 'NO ✗'}`);
  console.log(`outcomes recorded ${sumOutcomes} == answered+skipped ${completed * 10} ? ${sumOutcomes === completed * 10 ? 'YES ✓' : 'NO ✗'}`);
  console.log(`analytics records persisted: ${recs} == completed ${completed} ? ${recs === completed ? 'YES ✓' : 'NO ✗'}`);
  console.log('=============================');
  process.exit(0);
})().catch((e) => { console.error('[loadtest] fatal:', e); process.exit(1); });
