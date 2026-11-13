const { getDB } = require('../../config/database');
const { formatBytes } = require('../../utils/formatBytes');
const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { createS3Client } = require('../../config/s3');

// Total size of the S3 bucket, e.g. "84.5 MB". `null` when storage isn't configured
// or listing fails; the cause is logged and the dashboard shows it as unavailable.
async function getS3StorageSize() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
    console.error('[dashboard] S3 size unavailable: S3_BUCKET_NAME / AWS credentials are not configured in admin_ws/backend/.env.');
    return null;
  }
  try {
    const s3 = createS3Client({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    const command = new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET_NAME });
    const response = await s3.send(command);
    const totalBytes = (response.Contents || []).reduce((sum, item) => sum + (item.Size || 0), 0);
    return formatBytes(totalBytes);
  } catch (err) {
    console.error('[dashboard] S3 size unavailable: listing the bucket failed:', err.message);
    return null;
  }
}

exports.getStats = async (req, res, next) => {
  try {
    const db = getDB();

    // 1-3. Student, recruiter and job counts
    const { rows: [counts] } = await db.query(
      `SELECT
         (SELECT count(*) FROM "User" WHERE "role" = $1)::int AS "totalStudents",
         (SELECT count(*) FROM "User" WHERE "role" = $2)::int AS "totalRecruiters",
         (SELECT count(*) FROM "Job")::int AS "activeJobs"`,
      ['STUDENT', 'RECRUITER']
    );
    const { totalStudents, totalRecruiters, activeJobs } = counts;

    // 4. Certifications Verified (Count total certificates across all profiles)
    const { rows: certAgg } = await db.query(
      `SELECT COALESCE(SUM(
         CASE WHEN jsonb_typeof("certificates") = 'array' THEN jsonb_array_length("certificates") ELSE 0 END
       ), 0)::int AS total
       FROM "Profile"`
    );
    const verifiedCerts = certAgg[0]?.total || 0;

    // 5. Recent Registrations (empty when there are none)
    const { rows: recentUsers } = await db.query(
      `SELECT "id", "email", "createdAt" FROM "User" WHERE "role" = $1 ORDER BY "createdAt" DESC NULLS LAST, "id" DESC LIMIT 5`,
      ['STUDENT']
    );
    let recentStudents = [];
    if (recentUsers.length > 0) {
      const userIds = recentUsers.map(u => u.id);
      const { rows: profiles } = await db.query(
        `SELECT * FROM "Profile" WHERE "userId" = ANY($1::text[])`,
        [userIds]
      );

      recentStudents = recentUsers.map(user => {
        const profile = profiles.find(p => p.userId === user.id);
        return {
          name: profile?.name || 'Anonymous Student',
          email: user.email,
          skills: profile?.skills && profile.skills.length > 0 ? profile.skills.map(s => s.name).join(', ') : 'None',
          status: profile?.skills && profile.skills.length > 0 ? 'Skills added' : 'No skills yet'
        };
      });
    }

    // 6. S3 Storage
    const storageSize = await getS3StorageSize();

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalRecruiters,
        activeJobs,
        verifiedCerts,
        storageSize,
        recentStudents
      }
    });

  } catch (err) {
    next(err);
  }
};
