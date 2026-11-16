// How many things each candidate has applied to, for the Candidates list: jobs and
// internships (rows of "Application", told apart by the posting's opportunityType) and
// gigs (rows of "GigApplicant", called pitches). Read-only.
//
// Application.studentId holds a Profile id; GigApplicant.candidateId holds a User id
// (older rows may hold the Profile id). Both are matched either way, and each count is
// attributed to the candidate's User id, which is what the /student list uses as `id`.

const QUERIES = {
  jobApplications: `
    SELECT p."userId" AS "userId",
      count(*) FILTER (WHERE coalesce(j."opportunityType", 'JOB') = 'JOB')::int AS "jobs",
      count(*) FILTER (WHERE j."opportunityType" = 'INTERNSHIP')::int AS "internships"
    FROM "Application" a
    JOIN "Job" j ON j."id" = a."jobId"
    JOIN "Profile" p ON p."id" = a."studentId" OR p."userId" = a."studentId"
    GROUP BY p."userId"`,

  gigPitches: `
    SELECT p."userId" AS "userId", count(*)::int AS "gigs"
    FROM "GigApplicant" g
    JOIN "Profile" p ON p."userId" = g."candidateId" OR p."id" = g."candidateId"
    GROUP BY p."userId"`
};

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const rowsOf = (results, name) => (results[name] && results[name].rows) || [];

/** { userId: { jobs, internships, gigs, total } } for every candidate that has applied to anything. */
function applicationCountsByUser(results) {
  const counts = {};
  const entry = (userId) => (counts[userId] = counts[userId] || { jobs: 0, internships: 0, gigs: 0, total: 0 });
  for (const row of rowsOf(results, 'jobApplications')) {
    const e = entry(row.userId);
    e.jobs += num(row.jobs);
    e.internships += num(row.internships);
  }
  for (const row of rowsOf(results, 'gigPitches')) entry(row.userId).gigs += num(row.gigs);
  for (const e of Object.values(counts)) e.total = e.jobs + e.internships + e.gigs;
  return counts;
}

/** The students with an `applications` object added (all zeros when they have applied to nothing). */
function withApplicationCounts(students, results) {
  const counts = applicationCountsByUser(results);
  return students.map((student) => ({
    ...student,
    applications: counts[student.id] || { jobs: 0, internships: 0, gigs: 0, total: 0 }
  }));
}

module.exports = { QUERIES, applicationCountsByUser, withApplicationCounts };
