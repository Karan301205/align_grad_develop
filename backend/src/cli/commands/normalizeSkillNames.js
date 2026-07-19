const fs = require('fs');
const path = require('path');
const { prisma } = require('../../config/db');
const repo = require('../../services/questionBank/repositories/skillDefinitionRepository');
const { buildAliasIndex, resolveSkill } = require('../../services/questionBank/skills/normalize');

const ROLLBACK_DIR = path.join(__dirname, '../../../.rollback');

// Returns the canonical name only when it differs from what is stored.
function canonicalChange(index, storedName) {
  const canonical = resolveSkill(index, storedName);
  if (!canonical) return null;
  if (canonical === storedName) return null;
  return canonical;
}

// Pure: returns a new array with names canonicalized; every other field untouched.
// Entries that do not resolve to a different canonical keep their original object reference.
function applySkillRenames(index, skills) {
  return (skills || []).map((s) => {
    const canonical = canonicalChange(index, s.name);
    return canonical ? { ...s, name: canonical } : s;
  });
}

// Pure: same contract as applySkillRenames, but for Job.requirements[].skillName.
function applyRequirementRenames(index, reqs) {
  return (reqs || []).map((r) => {
    const canonical = canonicalChange(index, r.skillName);
    return canonical ? { ...r, skillName: canonical } : r;
  });
}

async function planProfiles(index) {
  // NOTE: Profile has no `deletedAt` field — do not add a soft-delete filter here,
  // Prisma will reject it with "Unknown argument deletedAt".
  const profiles = await prisma.profile.findMany({
    select: { id: true, name: true, skills: true },
  });

  const changes = [];
  for (const profile of profiles) {
    const skills = profile.skills || [];
    const updated = applySkillRenames(index, skills);

    const touched = updated.some((s, i) => s.name !== skills[i].name);
    if (touched) {
      changes.push({ id: profile.id, label: profile.name, before: skills, after: updated });
    }
  }
  return changes;
}

async function planJobs(index) {
  const jobs = await prisma.job.findMany({
    select: { id: true, title: true, requirements: true },
  });

  const changes = [];
  for (const job of jobs) {
    const reqs = job.requirements || [];
    const updated = applyRequirementRenames(index, reqs);

    const touched = updated.some((r, i) => r.skillName !== reqs[i].skillName);
    if (touched) {
      changes.push({ id: job.id, label: job.title, before: reqs, after: updated });
    }
  }
  return changes;
}

function summarise(changes, nameKey) {
  const tally = new Map();
  for (const change of changes) {
    change.before.forEach((item, i) => {
      const from = item[nameKey];
      const to = change.after[i][nameKey];
      if (from === to) return;
      const key = `${from}  ->  ${to}`;
      tally.set(key, (tally.get(key) || 0) + 1);
    });
  }
  return tally;
}

function printTally(title, tally) {
  console.log(`\n${title}`);
  if (tally.size === 0) {
    console.log('  (no changes)');
    return;
  }
  for (const [key, count] of [...tally.entries()].sort()) {
    console.log(`  ${key}   (${count})`);
  }
}

function writeRollback(profileChanges, jobChanges) {
  if (!fs.existsSync(ROLLBACK_DIR)) {
    fs.mkdirSync(ROLLBACK_DIR, { recursive: true });
  }
  const file = path.join(ROLLBACK_DIR, `normalize-skills-${Date.now()}.json`);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        profiles: profileChanges.map((c) => ({ id: c.id, skills: c.before })),
        jobs: jobChanges.map((c) => ({ id: c.id, requirements: c.before })),
      },
      null,
      2
    )
  );
  return file;
}

async function run({ commit }) {
  const definitions = await repo.findAll();
  if (definitions.length === 0) {
    throw new Error('Registry is empty. Run `npm run bank -- seed-skills --commit` first.');
  }

  const index = buildAliasIndex(definitions);
  console.log(`Registry: ${definitions.length} definitions, ${index.size} recognised spellings`);

  const profileChanges = await planProfiles(index);
  const jobChanges = await planJobs(index);

  printTally(`Profiles to update: ${profileChanges.length}`, summarise(profileChanges, 'name'));
  printTally(`Jobs to update: ${jobChanges.length}`, summarise(jobChanges, 'skillName'));

  if (profileChanges.length === 0 && jobChanges.length === 0) {
    console.log('\nNothing to normalize.');
    return;
  }

  if (!commit) {
    console.log('\nDRY RUN — no changes written. Re-run with --commit to persist.');
    return;
  }

  const rollbackFile = writeRollback(profileChanges, jobChanges);
  console.log(`\nRollback snapshot written to ${rollbackFile}`);

  for (const change of profileChanges) {
    await prisma.profile.update({
      where: { id: change.id },
      data: { skills: change.after },
    });
  }
  for (const change of jobChanges) {
    await prisma.job.update({
      where: { id: change.id },
      data: { requirements: change.after },
    });
  }

  console.log(`Committed: ${profileChanges.length} profiles, ${jobChanges.length} jobs updated.`);
}

module.exports = { run, canonicalChange, summarise, applySkillRenames, applyRequirementRenames };
