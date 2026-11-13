/**
 * One-off: import a `mongoexport` dump (one JSON doc per line, Extended JSON v2) into the
 * PostgreSQL schema defined by prisma/schema.prisma, keeping every original _id.
 *
 *   node scripts/migrate/importMongoExport.js                 # dry run: parse + convert, no writes
 *   node scripts/migrate/importMongoExport.js --commit        # insert (idempotent: skips existing ids)
 *   node scripts/migrate/importMongoExport.js --verify        # compare every field in DB vs export
 *   options: --dir <path to export folder>  (default: <repo>/align_grade_export)
 *
 * Field types come from the Prisma DMMF, so DateTime -> Date, Json -> plain JSON (nested
 * dates as ISO strings), String[]/Int[] -> arrays. Uses a raw PrismaClient (never the mock).
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('../../src/config/databaseUrl').ensureDatabaseUrl(); // DB_* parts -> DATABASE_URL (an inline DATABASE_URL wins)
const { PrismaClient, Prisma } = require('@prisma/client');

const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const VERIFY = args.includes('--verify');
const dirIdx = args.indexOf('--dir');
const EXPORT_DIR = dirIdx >= 0 ? path.resolve(args[dirIdx + 1]) : path.resolve(__dirname, '../../../../align_grade_export');

// Parents before children so foreign keys are satisfied.
const ORDER = [
  'User', 'Profile', 'Company', 'Job', 'Application', 'TestAttempt',
  'Gig', 'GigApplicant', 'GigMessage', 'GigSubmission', 'GigReview',
  'SkillDefinition', 'Question', 'TestSession', 'AssessmentRecord', 'SkillRoadmap',
  'Community', 'CommunityMember', 'CommunityInvite', 'Post', 'Media', 'PostReaction',
  'PostComment', 'SavedPost', 'PostView', 'PaymentTransaction', 'Course', 'CourseEnrollment',
];

const delegate = (model) => model.charAt(0).toLowerCase() + model.slice(1);

// Extended JSON v2 -> plain JS. `datesAs`: 'date' for scalar DateTime, 'iso' inside Json.
function fromEjson(v, datesAs) {
  if (Array.isArray(v)) return v.map((x) => fromEjson(x, datesAs));
  if (v && typeof v === 'object') {
    if ('$oid' in v) return v.$oid;
    if ('$date' in v) {
      const raw = v.$date;
      const d = new Date(typeof raw === 'object' && raw && '$numberLong' in raw ? Number(raw.$numberLong) : raw);
      return datesAs === 'iso' ? d.toISOString() : d;
    }
    if ('$numberLong' in v) return Number(v.$numberLong);
    if ('$numberInt' in v) return Number(v.$numberInt);
    if ('$numberDouble' in v) return Number(v.$numberDouble);
    if ('$numberDecimal' in v) return Number(v.$numberDecimal);
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = fromEjson(x, datesAs);
    return out;
  }
  return v;
}

function loadDocs(model) {
  const file = path.join(EXPORT_DIR, `${model}.json`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8').trim();
  if (!raw) return [];
  return raw.startsWith('[') ? JSON.parse(raw) : raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function toRow(doc, fields) {
  const row = { id: fromEjson(doc._id) };
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') continue;
    const f = fields[key];
    if (!f) throw new Error(`field "${key}" is not in the Prisma model`);
    if (f.kind === 'object') throw new Error(`field "${key}" is a relation, not a column`);
    if (value === null) { row[key] = f.type === 'Json' ? Prisma.DbNull : null; continue; }
    row[key] = fromEjson(value, f.type === 'Json' ? 'iso' : 'date');
  }
  return row;
}

// Canonical form for comparisons: dates -> ISO, object keys sorted.
function canon(v) {
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  return v;
}

async function main() {
  const url = process.env.DATABASE_URL || '';
  if (!/^postgres(ql)?:\/\//.test(url)) throw new Error('No PostgreSQL target: set DB_HOST/DB_NAME/DB_USER/DB_PASSWORD (or a postgresql:// DATABASE_URL) — refusing to run.');
  if (!fs.existsSync(EXPORT_DIR)) throw new Error(`Export folder not found: ${EXPORT_DIR}`);

  const models = Object.fromEntries(Prisma.dmmf.datamodel.models.map((m) => [m.name, Object.fromEntries(m.fields.map((f) => [f.name, f]))]));
  const prisma = new PrismaClient();
  const mode = VERIFY ? 'VERIFY' : COMMIT ? 'COMMIT' : 'DRY RUN';
  console.log(`[${mode}] export: ${EXPORT_DIR}`);
  console.log(`[${mode}] target: ${url.replace(/\/\/[^@]*@/, '//***@')}\n`);

  let problems = 0;
  try {
    for (const model of ORDER) {
      const docs = loadDocs(model);
      if (docs === null) continue; // no export file for this model (table stays empty)
      const rows = docs.map((d) => toRow(d, models[model]));
      const db = prisma[delegate(model)];

      if (VERIFY) {
        const found = await db.findMany({ where: { id: { in: rows.map((r) => r.id) } } });
        const byId = new Map(found.map((r) => [r.id, r]));
        let missing = 0; let diffs = 0;
        for (const src of rows) {
          const got = byId.get(src.id);
          if (!got) { missing++; continue; }
          for (const [k, v] of Object.entries(src)) {
            const expected = v === Prisma.DbNull ? null : v;
            if (JSON.stringify(canon(expected)) !== JSON.stringify(canon(got[k]))) {
              if (diffs < 3) console.log(`   diff ${model}.${k} id=${src.id}`);
              diffs++;
            }
          }
        }
        const total = await db.count();
        problems += missing + diffs;
        console.log(`${model.padEnd(20)} export=${String(rows.length).padStart(5)}  in DB=${String(total).padStart(5)}  missing=${missing}  field diffs=${diffs}`);
        continue;
      }

      if (!COMMIT) { console.log(`${model.padEnd(20)} ${rows.length} rows converted OK`); continue; }

      let inserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const res = await db.createMany({ data: rows.slice(i, i + 500), skipDuplicates: true });
        inserted += res.count;
      }
      console.log(`${model.padEnd(20)} ${String(rows.length).padStart(5)} in export, ${String(inserted).padStart(5)} inserted (${rows.length - inserted} already present)`);
    }
  } finally {
    await prisma.$disconnect();
  }
  if (VERIFY) {
    console.log(problems === 0 ? '\nVERIFY OK — every exported document and field is in PostgreSQL.' : `\nVERIFY FOUND ${problems} PROBLEM(S).`);
    if (problems) process.exitCode = 1;
  }
}

main().catch((err) => { console.error('Import failed:', err.message); process.exit(1); });
