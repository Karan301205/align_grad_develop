const { getDB } = require('../../config/database');

exports.getAllStudents = async (req, res, next) => {
  try {
    const db = getDB();
    // ORDER BY "id" approximates the previous natural (insertion) order: ids are
    // time-prefixed hex strings.
    const { rows: students } = await db.query(
      'SELECT "id", "email", "createdAt" FROM "User" WHERE "role" = $1 ORDER BY "id"',
      ['STUDENT']
    );
    if (students.length === 0) {
      return res.json({ success: true, students: [] });
    }

    const userIds = students.map(s => s.id);
    const { rows: profiles } = await db.query(
      'SELECT * FROM "Profile" WHERE "userId" = ANY($1::text[])',
      [userIds]
    );

    const studentsWithProfiles = students.map(student => {
      const profile = profiles.find(p => p.userId === student.id);
      return {
        id: student.id,
        email: student.email,
        createdAt: student.createdAt,
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
      students: studentsWithProfiles
    });
  } catch (err) {
    next(err);
  }
};
