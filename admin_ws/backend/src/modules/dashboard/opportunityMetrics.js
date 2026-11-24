// GET /api/dashboard/opportunities: live numbers for the dashboard charts. Read-only.
//
// "Opportunities" are the three things candidates can apply to: jobs and internships
// (the "Job" table, told apart by opportunityType) and gigs (the "Gig" table).
// Each query below is one small aggregate; shapeMetrics() turns their rows into the
// response, so the shaping can be unit-tested without a database.

const WEEKS = 8;

// A posting candidates can currently see: not paused, closed or past its end date (the same
// rule as main_website modules/jobs/jobLifecycle.service.js isJobOpen). Expired jobs stay in
// the table for a while now instead of being deleted at once, so the date check matters.
const OPEN_JOB = `coalesce("status", 'ACTIVE') NOT IN ('PAUSED', 'CLOSED') AND coalesce("isPaused", false) = false AND ("expiresAt" IS NULL OR "expiresAt" > now())`;
const IS_JOB = `coalesce("opportunityType", 'JOB') = 'JOB'`;
const IS_INTERNSHIP = `"opportunityType" = 'INTERNSHIP'`;

const QUERIES = {
  listings: `
    SELECT
      count(*) FILTER (WHERE ${IS_JOB})::int AS "jobs",
      count(*) FILTER (WHERE ${IS_INTERNSHIP})::int AS "internships",
      count(*) FILTER (WHERE coalesce("opportunityType", 'JOB') NOT IN ('JOB', 'INTERNSHIP'))::int AS "other",
      count(*) FILTER (WHERE ${IS_JOB} AND ${OPEN_JOB})::int AS "openJobs",
      count(*) FILTER (WHERE ${IS_INTERNSHIP} AND ${OPEN_JOB})::int AS "openInternships"
    FROM "Job"`,

  workModes: `
    SELECT coalesce("workMode", 'Not specified') AS "name", count(*)::int AS "count"
    FROM "Job"
    WHERE coalesce("opportunityType", 'JOB') IN ('JOB', 'INTERNSHIP')
    GROUP BY 1 ORDER BY 2 DESC, 1`,

  activity: `
    SELECT (SELECT count(*) FROM "Application")::int AS "applications",
           (SELECT count(*) FROM "GigApplicant")::int AS "pitches"`,

  gigStatus: `
    SELECT coalesce("status", 'OPEN') AS "status", count(*)::int AS "count"
    FROM "Gig" GROUP BY 1 ORDER BY 2 DESC, 1`,

  gigCategories: `
    SELECT coalesce(nullif("category", ''), 'Uncategorised') AS "name", count(*)::int AS "count"
    FROM "Gig" GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 6`,

  gigBudget: `
    SELECT "currency", sum("budget")::float8 AS "total", count(*)::int AS "count"
    FROM "Gig" WHERE "status" = 'OPEN' GROUP BY 1 ORDER BY 3 DESC, 1`,

  gigHired: `
    SELECT coalesce(sum(cardinality("hiredCandidateIds")), 0)::int AS "hired" FROM "Gig"`,

  weekly: `
    WITH weeks AS (
      SELECT generate_series(
        date_trunc('week', now()) - interval '${WEEKS - 1} weeks',
        date_trunc('week', now()),
        interval '1 week'
      ) AS "week"
    )
    SELECT to_char(w."week", 'YYYY-MM-DD') AS "weekStart",
      (SELECT count(*) FROM "Job" j WHERE coalesce(j."opportunityType", 'JOB') = 'JOB' AND date_trunc('week', j."createdAt") = w."week")::int AS "jobs",
      (SELECT count(*) FROM "Job" j WHERE j."opportunityType" = 'INTERNSHIP' AND date_trunc('week', j."createdAt") = w."week")::int AS "internships",
      (SELECT count(*) FROM "Gig" g WHERE date_trunc('week', g."createdAt") = w."week")::int AS "gigs",
      (SELECT count(*) FROM "Application" a WHERE date_trunc('week', a."createdAt") = w."week")::int AS "applications",
      (SELECT count(*) FROM "GigApplicant" p WHERE date_trunc('week', p."createdAt") = w."week")::int AS "pitches"
    FROM weeks w ORDER BY w."week"`,

  // The five postings with the most applicants or pitches, across all three kinds.
  popular: `
    SELECT * FROM (
      SELECT CASE WHEN j."opportunityType" = 'INTERNSHIP' THEN 'INTERNSHIP' ELSE 'JOB' END AS "type",
             j."id", j."title", coalesce(c."name", j."companyName", '') AS "company", count(a."id")::int AS "count"
      FROM "Job" j
      JOIN "Application" a ON a."jobId" = j."id"
      LEFT JOIN "Company" c ON c."id" = j."companyId"
      WHERE coalesce(j."opportunityType", 'JOB') IN ('JOB', 'INTERNSHIP')
      GROUP BY j."id", c."name"
      UNION ALL
      SELECT 'GIG'::text AS "type", g."id", g."title", coalesce(c."name", '') AS "company", count(p."id")::int AS "count"
      FROM "Gig" g
      JOIN "GigApplicant" p ON p."gigId" = g."id"
      LEFT JOIN "Company" c ON c."userId" = g."ownerId"
      GROUP BY g."id", c."name"
    ) ranked
    ORDER BY "count" DESC, "title" LIMIT 5`
};

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const rowsOf = (results, name) => (results[name] && results[name].rows) || [];
const countFor = (rows, status) => num((rows.find((r) => r.status === status) || {}).count);

/** Turns the rows of every query in QUERIES into the API response (without `success`). */
function shapeMetrics(results, generatedAt = new Date()) {
  const listings = rowsOf(results, 'listings')[0] || {};
  const activity = rowsOf(results, 'activity')[0] || {};
  const gigStatus = rowsOf(results, 'gigStatus').map((r) => ({ status: String(r.status), count: num(r.count) }));
  const gigTotal = gigStatus.reduce((sum, r) => sum + r.count, 0);

  return {
    generatedAt: generatedAt.toISOString(),
    listings: {
      jobs: num(listings.jobs),
      internships: num(listings.internships),
      other: num(listings.other),
      gigs: gigTotal,
      openJobs: num(listings.openJobs),
      openInternships: num(listings.openInternships),
      openGigs: countFor(gigStatus, 'OPEN'),
      gigsInProgress: countFor(gigStatus, 'IN_PROGRESS')
    },
    activity: { applications: num(activity.applications), pitches: num(activity.pitches) },
    workModes: rowsOf(results, 'workModes').map((r) => ({ name: String(r.name), count: num(r.count) })),
    gigs: {
      byStatus: gigStatus,
      byCategory: rowsOf(results, 'gigCategories').map((r) => ({ name: String(r.name), count: num(r.count) })),
      openBudget: rowsOf(results, 'gigBudget').map((r) => ({ currency: String(r.currency || 'INR'), total: num(r.total), count: num(r.count) })),
      hired: num((rowsOf(results, 'gigHired')[0] || {}).hired)
    },
    weekly: rowsOf(results, 'weekly').map((r) => ({
      weekStart: String(r.weekStart),
      jobs: num(r.jobs),
      internships: num(r.internships),
      gigs: num(r.gigs),
      applications: num(r.applications),
      pitches: num(r.pitches)
    })),
    popular: rowsOf(results, 'popular').map((r) => ({
      type: String(r.type),
      id: String(r.id),
      title: String(r.title),
      company: String(r.company || ''),
      count: num(r.count)
    }))
  };
}

module.exports = { WEEKS, QUERIES, shapeMetrics };
