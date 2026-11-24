// Recruiter candidate search: filters, sort, "recommended" match % and job comparison run in
// PostgreSQL and return one page, so the work per request doesn't grow with every sign-up.
// Skills come from the CandidateSkill table (kept in sync with Profile.skills by a database
// trigger, migration 20261124130000_candidate_skills).
//
// The rules mirror what the Candidates page used to do in the browser:
//   search      name, username, bio, education (institute + degree) and skill names
//   skills      each wanted skill must be on the profile; for skills with a test also
//               the minimum score, or a verified score when "verified only"
//   education   one entry matching college / degree (case, spaces and punctuation ignored)
//               and graduation year
//   match       the recruiter's demand-profile match (skillMatching.service
//               calculateRecruiterCandidateMatch), computed here in SQL
//   comparison  a job's bars against the candidate (state above / meets / below, short
//               counts only bars that can stop applying)
// Skill names match through the registry (registryCache.spellingsOf), so aliases count.

const { Prisma } = require('@prisma/client');
const { prisma } = require('../../infrastructure/database');
const registryCache = require('../assessments/question-bank/skills/registryCache');
const { normalizeToken } = require('../assessments/question-bank/skills/normalize');
const { gatesApplying } = require('../jobs/eligiblePool');
const { cached } = require('../../shared/cache/ttlCache');

const FACETS_TTL_MS = 5 * 60 * 1000;
const MAX_FACET_SKILLS = 500;

/* ------------------------------------------------------------------ tables */

// Raw SQL names its tables with the schema from DATABASE_URL (?schema=), so it doesn't rely
// on the connection's search_path (which PgBouncer in transaction mode doesn't keep).
let schemaPrefix = null;
function table(name) {
  if (schemaPrefix === null) {
    let schema = '';
    try {
      schema = new URL(process.env.DATABASE_URL).searchParams.get('schema') || '';
    } catch {
      schema = '';
    }
    schemaPrefix = schema ? `"${schema.replace(/"/g, '""')}".` : '';
  }
  return Prisma.raw(`${schemaPrefix}"${name}"`);
}

/* ------------------------------------------------------------- small helpers */

const escapeLike = (text) => String(text).replace(/[\\%_]/g, (char) => `\\${char}`);
/** "B.Tech", "b. tech" and "BTECH" are one value (frontend candidateData normalizeKey). */
const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const keysFor = (skillName) => registryCache.spellingsOf(skillName);
const effectiveScore = (skill) => (skill && skill.verifiedRating > 0 ? skill.verifiedRating : (skill && skill.rating) || 0);

const EDUCATION = Prisma.sql`(CASE WHEN jsonb_typeof(p."education") = 'array' THEN p."education" ELSE '[]'::jsonb END)`;
const EXPERIENCE_COUNT = Prisma.sql`(CASE WHEN jsonb_typeof(p."experience") = 'array' THEN jsonb_array_length(p."experience") ELSE 0 END)`;
const SKILL_COUNT = Prisma.sql`(CASE WHEN jsonb_typeof(p."skills") = 'array' THEN jsonb_array_length(p."skills") ELSE 0 END)`;
const EDUCATION_KEY = (field) => Prisma.sql`regexp_replace(lower(coalesce(e->>${field}, '')), '[^a-z0-9]+', '', 'g')`;
const EDUCATION_YEAR = Prisma.sql`(CASE WHEN coalesce(e->>'endDate', '') ~ '^[0-9]{4}' THEN substr(e->>'endDate', 1, 4) END)`;
const HAS_EDUCATION_ENTRY = Prisma.sql`jsonb_typeof(e) = 'object' AND (btrim(coalesce(e->>'degree', '')) <> '' OR btrim(coalesce(e->>'institute', '')) <> '')`;

/** The candidate has one of `keys` (with an optional extra condition on that skill row). */
function hasSkill(keys, extra = Prisma.empty) {
  return Prisma.sql`EXISTS (SELECT 1 FROM ${table('CandidateSkill')} cs WHERE cs."profileId" = p."id" AND cs."normKey" = ANY(${keys}::text[]) ${extra})`;
}

/* -------------------------------------------------------- recommended match */

/**
 * The CTE `m AS MATERIALIZED (…)`: m(pid, match_score, verified_matches, matching), the
 * demand-profile match of every candidate holding at least one demanded skill, as
 * skillMatching.service calculateRecruiterCandidateMatch computes it:
 *   round(100 × (0.6 × Σ w·min(1, score/avg) + 0.4 × Σ w) / W) over the demanded skills held.
 * Materialized so a match filter isn't pushed inside: that made the planner expect a handful of
 * rows and look candidates up one by one. Join it with MATCH_JOIN.
 */
function matchCte(demand) {
  const skills = demand.skillList;
  const weights = skills.map((skill) => (skill.weight > 0 ? skill.weight : skill.frequency > 0 ? skill.frequency : 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const keyIndex = [];
  const keys = [];
  skills.forEach((skill, index) => keysFor(skill.name).forEach((key) => {
    keyIndex.push(index);
    keys.push(key);
  }));
  const indexes = skills.map((_, index) => index);
  const averages = skills.map((skill) => (skill.avgRating > 0 ? skill.avgRating : 1));
  return Prisma.sql`m AS MATERIALIZED (
    SELECT b.pid,
           round(((0.6 * sum(d.weight * least(1.0, b.score / d.avg)) + 0.4 * sum(d.weight)) / ${totalWeight}::float8 * 100)::numeric)::int AS match_score,
           (count(*) FILTER (WHERE b.verified > 0))::int AS verified_matches,
           count(*)::int AS matching
    FROM (
      SELECT cs."profileId" AS pid, dk.idx, max(cs."score")::float8 AS score, max(cs."verifiedRating") AS verified
      FROM ${table('CandidateSkill')} cs
      JOIN unnest(${keyIndex}::int[], ${keys}::text[]) AS dk(idx, key) ON cs."normKey" = dk.key
      WHERE cs."score" > 0
      GROUP BY cs."profileId", dk.idx
    ) b
    JOIN unnest(${indexes}::int[], ${weights}::float8[], ${averages}::float8[]) AS d(idx, weight, avg) ON d.idx = b.idx
    GROUP BY b.pid
  )`;
}
const MATCH_JOIN = Prisma.sql`LEFT JOIN m ON m.pid = p."id"`;

/* ------------------------------------------------------------ job comparison */

/** A job's bars with their keys and whether each can stop someone applying. */
function comparisonBars(job, quizSkills) {
  return (Array.isArray(job?.requirements) ? job.requirements : [])
    .filter((req) => req && req.skillName)
    .map((req) => ({
      skillName: req.skillName,
      minRating: Number(req.minRating) || 0,
      keys: keysFor(req.skillName),
      gates: gatesApplying(req.skillName, quizSkills)
    }));
}

/** One candidate against the bars (same shape as the frontend's old compareWithJob). */
function compareSkills(skills, bars) {
  const scoreByKey = new Map();
  (skills || []).forEach((skill) => {
    const key = normalizeToken(typeof skill === 'string' ? skill : skill?.name);
    if (key) scoreByKey.set(key, Math.max(scoreByKey.get(key) || 0, effectiveScore(skill)));
  });
  const shown = bars.map(({ skillName, minRating, keys, gates }) => {
    const score = Math.max(0, ...keys.map((key) => scoreByKey.get(key) || 0));
    return { skillName, minRating, score, gates, state: score > minRating ? 'above' : score === minRating ? 'meets' : 'below' };
  });
  const short = shown.filter((bar) => bar.gates && bar.state === 'below').length;
  return { bars: shown, short, meetsAll: short === 0 };
}

/** SQL: meets every bar that can stop someone applying. */
const meetsAllBars = (bars) => bars.filter((bar) => bar.gates).map((bar) => hasSkill(bar.keys, Prisma.sql`AND cs."score" >= ${bar.minRating}`));

/* ------------------------------------------------------------------ filters */

function conditions(filters, { quizSkills, ids, excludeProfileIds, matchScore }) {
  const where = [];
  const q = (filters.q || '').trim();
  if (q) {
    const like = `%${escapeLike(q)}%`;
    where.push(Prisma.sql`(
      p."name" ILIKE ${like} OR coalesce(p."username", '') ILIKE ${like} OR coalesce(p."bio", '') ILIKE ${like}
      OR EXISTS (SELECT 1 FROM jsonb_array_elements(${EDUCATION}) e
                 WHERE jsonb_typeof(e) = 'object' AND (coalesce(e->>'institute', '') || ' ' || coalesce(e->>'degree', '')) ILIKE ${like})
      OR EXISTS (SELECT 1 FROM ${table('CandidateSkill')} cs WHERE cs."profileId" = p."id" AND cs."name" ILIKE ${like})
    )`);
  }
  if (filters.workMode) where.push(Prisma.sql`${filters.workMode} = ANY(p."preferredWorkModes")`);
  if (filters.workType) where.push(Prisma.sql`${filters.workType} = ANY(p."preferredWorkTypes")`);
  if (filters.location === 'Any Location') where.push(Prisma.sql`p."openToAnyLocation" IS TRUE`);
  else if (filters.location) where.push(Prisma.sql`(${filters.location} = ANY(p."preferredLocations") OR p."openToAnyLocation" IS TRUE)`);

  (filters.skills || []).forEach((wanted) => {
    const keys = keysFor(wanted.name);
    const tested = quizSkills.has(registryCache.resolve(wanted.name).toLowerCase());
    if (tested && wanted.verifiedOnly) where.push(hasSkill(keys, Prisma.sql`AND cs."verifiedRating" > 0`));
    else if (tested && wanted.minRating > 0) where.push(hasSkill(keys, Prisma.sql`AND cs."score" >= ${wanted.minRating}`));
    else where.push(hasSkill(keys));
  });

  if (filters.college || filters.degree || filters.year) {
    const entry = [HAS_EDUCATION_ENTRY];
    if (filters.college) entry.push(Prisma.sql`${EDUCATION_KEY('institute')} = ${normalizeKey(filters.college)}`);
    if (filters.degree) entry.push(Prisma.sql`${EDUCATION_KEY('degree')} = ${normalizeKey(filters.degree)}`);
    if (filters.year) entry.push(Prisma.sql`${EDUCATION_YEAR} = ${filters.year}`);
    where.push(Prisma.sql`EXISTS (SELECT 1 FROM jsonb_array_elements(${EDUCATION}) e WHERE ${Prisma.join(entry, ' AND ')})`);
  }

  if (filters.credential === 'verified_skills') where.push(Prisma.sql`EXISTS (SELECT 1 FROM ${table('CandidateSkill')} cs WHERE cs."profileId" = p."id" AND cs."verifiedRating" > 0)`);
  if (filters.credential === 'has_video') where.push(Prisma.sql`coalesce(p."introVideoUrl", '') <> ''`);
  if (filters.credential === 'has_resume') where.push(Prisma.sql`coalesce(p."resumeUrl", '') <> ''`);
  if (filters.experience === 'experienced') where.push(Prisma.sql`${EXPERIENCE_COUNT} > 0`);
  if (filters.experience === 'fresher') where.push(Prisma.sql`${EXPERIENCE_COUNT} = 0`);

  if (filters.match === '70') where.push(Prisma.sql`${matchScore} >= 70`);
  if (filters.match === '50') where.push(Prisma.sql`${matchScore} >= 50`);
  if (filters.match === 'any') where.push(Prisma.sql`${matchScore} > 0`);

  if (ids) where.push(Prisma.sql`(p."id" = ANY(${ids}::text[]) OR p."userId" = ANY(${ids}::text[]))`);
  if (excludeProfileIds && excludeProfileIds.length > 0) where.push(Prisma.sql`NOT (p."id" = ANY(${excludeProfileIds}::text[]))`);
  return where;
}

/** Verified-skill counts, joined only for the "most verified skills" sort. */
const verifiedJoin = () => Prisma.sql`LEFT JOIN (
  SELECT "profileId", count(*)::int AS n FROM ${table('CandidateSkill')} WHERE "verifiedRating" > 0 GROUP BY "profileId"
) vc ON vc."profileId" = p."id"`;

/** ORDER BY over the sort keys of `f` (see searchCandidates), for table alias `t`. */
function orderBy(sort, t) {
  const c = (column) => Prisma.raw(`${t}.${column}`);
  switch (sort) {
    case 'verified_desc': return Prisma.sql`${c('verified_count')} DESC, ${c('skill_count')} DESC, ${c('id')} DESC`;
    case 'skills_count': return Prisma.sql`${c('skill_count')} DESC, ${c('id')} DESC`;
    case 'name_asc': return Prisma.sql`${c('name_key')} ASC, ${c('id')} ASC`;
    case 'newest': return Prisma.sql`${c('id')} DESC`; // ids start with their creation time
    default: // recommended: by match (0 for everyone without active jobs), then newest
      return Prisma.sql`${c('match_score')} DESC, ${c('verified_matches')} DESC, ${c('matching')} DESC, ${c('skill_count')} DESC, ${c('id')} DESC`;
  }
}

/** The latest education entry with a degree or institute (enough for the card's one line). */
function latestEducation(education) {
  const entries = (Array.isArray(education) ? education : []).filter((edu) => edu && (edu.degree || edu.institute));
  entries.sort((a, b) => String(b.endDate || '').localeCompare(String(a.endDate || '')));
  return entries.slice(0, 1);
}

const where = (list) => (list.length ? Prisma.sql`WHERE ${Prisma.join(list, ' AND ')}` : Prisma.empty);

/**
 * One page of candidates as cards.
 * @param {object} args
 * @param {object} args.filters   validated body (q, skills, workMode, workType, location, college,
 *                                degree, year, credential, experience, match, sort, onlyMeets)
 * @param {object} args.demand    skillMatching.service buildRecruiterDemandProfile(active jobs)
 * @param {object|null} args.job  the recruiter's own job to compare with
 * @param {Set<string>} args.quizSkills skills with a test
 * @param {boolean} [args.countTotal] false skips counting all matches (total is then null)
 * @returns {Promise<{ items, total, meetsCount }>}
 */
async function searchCandidates({ filters, page, pageSize, demand, job, quizSkills, ids = null, excludeProfileIds = null, countTotal = true }) {
  const hasDemand = Boolean(demand && demand.skillList && demand.skillList.length > 0);
  const matchScore = hasDemand ? Prisma.sql`coalesce(m.match_score, 0)` : Prisma.sql`0`;
  const bars = job ? comparisonBars(job, quizSkills) : null;

  const base = conditions(filters, { quizSkills, ids, excludeProfileIds, matchScore });
  const filtered = bars && filters.onlyMeets ? [...base, ...meetsAllBars(bars)] : base;
  const verifiedSort = filters.sort === 'verified_desc';
  const join = hasDemand ? MATCH_JOIN : Prisma.empty;
  const extraJoin = verifiedSort ? verifiedJoin() : Prisma.empty;
  const ctes = (...more) => {
    const list = [...(hasDemand ? [matchCte(demand)] : []), ...more];
    return list.length ? Prisma.sql`WITH ${Prisma.join(list, ', ')}` : Prisma.empty;
  };

  const P = table('Profile');
  // One query: f holds the matching candidates with only their sort keys (the match scores are
  // computed once, in m). The total is counted from f, the page is the top rows of f, and the
  // full card data is read for just those rows.
  const filteredSet = Prisma.sql`f AS MATERIALIZED (
    SELECT p."id", ${matchScore} AS match_score,
           ${hasDemand ? Prisma.sql`coalesce(m.verified_matches, 0)` : Prisma.sql`0`} AS verified_matches,
           ${hasDemand ? Prisma.sql`coalesce(m.matching, 0)` : Prisma.sql`0`} AS matching,
           ${SKILL_COUNT} AS skill_count,
           ${verifiedSort ? Prisma.sql`coalesce(vc.n, 0)` : Prisma.sql`0`} AS verified_count,
           lower(p."name") AS name_key
    FROM ${P} p ${join} ${extraJoin} ${where(filtered)}
  )`;
  const [rows, meets] = await Promise.all([
    prisma.$queryRaw`
      ${ctes(filteredSet)}
      SELECT p."id", p."userId", p."name", p."username", p."profilePic", p."skills", p."education", p."introVideoUrl", p."resumeUrl",
             p."preferredWorkModes", p."preferredWorkTypes", p."preferredLocations", p."openToAnyLocation",
             top.match_score, ${countTotal ? Prisma.sql`(SELECT count(*) FROM f)::int` : Prisma.sql`NULL::int`} AS total_count
      FROM (SELECT * FROM f ORDER BY ${orderBy(filters.sort, 'f')} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}) top
      JOIN ${P} p ON p."id" = top."id"
      ORDER BY ${orderBy(filters.sort, 'top')}`,
    bars && !filters.onlyMeets
      ? prisma.$queryRaw`${filters.match ? ctes() : Prisma.empty} SELECT count(*)::int AS total FROM ${P} p ${filters.match ? join : Prisma.empty} ${where([...base, ...meetsAllBars(bars)])}`
      : Promise.resolve(null)
  ]);
  let total = rows.length > 0 ? rows[0].total_count : countTotal ? 0 : null;
  if (rows.length === 0 && page > 1 && countTotal) {
    // Past the last page there's no row to carry the count: count separately.
    [{ total }] = await prisma.$queryRaw`${filters.match ? ctes() : Prisma.empty} SELECT count(*)::int AS total FROM ${P} p ${filters.match ? join : Prisma.empty} ${where(filtered)}`;
  }

  const items = rows.map((row) => {
    const skills = (Array.isArray(row.skills) ? row.skills : [])
      .filter((skill) => skill && (typeof skill === 'string' || skill.name))
      .map((skill) => (typeof skill === 'string' ? { name: skill, rating: 0, verifiedRating: 0 } : { name: skill.name, rating: skill.rating || 0, verifiedRating: skill.verifiedRating || 0 }));
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      username: row.username,
      profilePic: row.profilePic,
      skills,
      education: latestEducation(row.education),
      introVideoUrl: row.introVideoUrl,
      resumeUrl: row.resumeUrl,
      preferredWorkModes: row.preferredWorkModes || [],
      preferredWorkTypes: row.preferredWorkTypes || [],
      preferredLocations: row.preferredLocations || [],
      openToAnyLocation: row.openToAnyLocation === true,
      matchScore: hasDemand ? row.match_score : null,
      ...(bars ? { comparison: compareSkills(skills, bars) } : {})
    };
  });

  return { items, total, meetsCount: bars ? (filters.onlyMeets ? total : meets[0].total) : null };
}

/* ------------------------------------------------------------------- facets */

const tidy = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const capitals = (value) => (value.match(/[A-Z]/g) || []).length;
const mixedCase = (value) => (/[a-z]/.test(value) && /[A-Z]/.test(value) ? 1 : 0);

/**
 * One option per normalised value, labelled with its most common spelling (frontend
 * candidateData mergedOptions). Ties: mixed case, more capitals, shorter, then A–Z.
 * @param {Array<{ value: string, n: number }>} rows spellings with how often each occurs
 */
function mergedOptions(rows) {
  const groups = new Map();
  rows.forEach(({ value, n }) => {
    const label = tidy(value);
    const key = normalizeKey(label);
    if (!key) return;
    const spellings = groups.get(key) || new Map();
    spellings.set(label, (spellings.get(label) || 0) + Number(n || 0));
    groups.set(key, spellings);
  });
  return [...groups.values()]
    .map((spellings) => [...spellings.entries()].sort(
      (a, b) => b[1] - a[1] || mixedCase(b[0]) - mixedCase(a[0]) || capitals(b[0]) - capitals(a[0]) || a[0].length - b[0].length || a[0].localeCompare(b[0])
    )[0][0])
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/** Filter menus for every recruiter: total candidates, skills with counts, colleges, degrees, years. Cached 5 min. */
function candidateFacets() {
  return cached('candidates:facets', FACETS_TTL_MS, async () => {
    const P = table('Profile');
    const educationValues = (field) => prisma.$queryRaw`
      SELECT btrim(e->>${field}) AS value, count(*)::int AS n
      FROM ${P} p CROSS JOIN LATERAL jsonb_array_elements(${EDUCATION}) e
      WHERE ${HAS_EDUCATION_ENTRY} AND btrim(coalesce(e->>${field}, '')) <> ''
      GROUP BY 1`;
    const [[{ total }], skills, colleges, degrees, years] = await Promise.all([
      prisma.$queryRaw`SELECT count(*)::int AS total FROM ${P}`,
      prisma.$queryRaw`SELECT "name", count(*)::int AS n FROM ${table('CandidateSkill')} GROUP BY "name" ORDER BY n DESC, "name" ASC LIMIT ${MAX_FACET_SKILLS}`,
      educationValues('institute'),
      educationValues('degree'),
      prisma.$queryRaw`
        SELECT DISTINCT ${EDUCATION_YEAR} AS year
        FROM ${P} p CROSS JOIN LATERAL jsonb_array_elements(${EDUCATION}) e
        WHERE ${HAS_EDUCATION_ENTRY} AND ${EDUCATION_YEAR} IS NOT NULL`
    ]);
    const skillCounts = {};
    skills.forEach((row) => {
      skillCounts[row.name] = (skillCounts[row.name] || 0) + row.n;
    });
    return {
      total,
      skillCounts,
      popularSkills: skills.slice(0, 8).map((row) => row.name),
      education: {
        colleges: mergedOptions(colleges),
        degrees: mergedOptions(degrees),
        years: years.map((row) => row.year).sort((a, b) => b.localeCompare(a))
      }
    };
  });
}

module.exports = { searchCandidates, candidateFacets, compareSkills, comparisonBars, mergedOptions, latestEducation };
