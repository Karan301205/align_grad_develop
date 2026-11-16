const { getDB } = require('../../config/database');
const { summarizeJob } = require('./jobSummary');
const { isValidId, normalizeId } = require('../../utils/ids');

exports.getAllJobs = async (req, res, next) => {
  try {
    const db = getDB();
    // ORDER BY "id" approximates the previous natural (insertion) order: ids are
    // time-prefixed hex strings.
    const { rows: jobs } = await db.query('SELECT * FROM "Job" ORDER BY "id"');
    const companyIds = jobs.map(j => j.companyId);
    const { rows: companies } = await db.query(
      'SELECT * FROM "Company" WHERE "id" = ANY($1::text[])',
      [companyIds]
    );

    const jobsWithCompany = jobs.map(job => summarizeJob(job, companies.find(c => c.id === job.companyId)));

    res.json({
      success: true,
      jobs: jobsWithCompany
    });

  } catch (err) {
    next(err);
  }
};

exports.getJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const db = getDB();
    // Fetch applications
    if (!isValidId(jobId)) {
      return res.status(400).json({ error: 'Invalid Job ID format' });
    }

    const { rows: applications } = await db.query(
      'SELECT "studentId" FROM "Application" WHERE "jobId" = $1',
      [normalizeId(jobId)]
    );
    if (applications.length === 0) {
      return res.json({ success: true, applicants: [] });
    }

    // Application.studentId holds a Profile.id (not a User.id). Profiles are
    // matched by id, and also by userId in case a row stores the User id
    // instead; users are then resolved through the matched profiles.
    const studentIds = [...new Set(applications.map(app => app.studentId))];
    const { rows: profiles } = await db.query(
      'SELECT * FROM "Profile" WHERE "id" = ANY($1::text[]) OR "userId" = ANY($1::text[])',
      [studentIds]
    );
    const userIds = [...new Set([...profiles.map(p => p.userId), ...studentIds])];
    const { rows: users } = await db.query(
      'SELECT "id", "email" FROM "User" WHERE "id" = ANY($1::text[]) ORDER BY "id"',
      [userIds]
    );

    const applicants = users.map(user => {
      const profile = profiles.find(p => p.userId === user.id);
      return {
        id: user.id,
        email: user.email,
        name: profile?.name || 'Anonymous Student',
        username: profile?.username || 'N/A',
        bio: profile?.bio || '',
        nationality: profile?.nationality || '',
        gender: profile?.gender || '',
        phone: profile?.phone || '',
        dob: profile?.dob || '',
        resumeUrl: profile?.resumeUrl || '',
        skills: profile?.skills || [],
        tests: profile?.tests || [],
        education: profile?.education || [],
        experience: profile?.experience || [],
        certificates: profile?.certificates || [],
        projects: profile?.projects || [],
        cocurricular: profile?.cocurricular || [],
        introVideoUrl: profile?.introVideoUrl || ''
      };
    });

    res.json({
      success: true,
      applicants
    });

  } catch (err) {
    next(err);
  }
};
