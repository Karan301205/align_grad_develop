const { getDbSafe } = require('../config/database');

exports.getAllRecruiters = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) {
      console.warn('[DB WARNING] Database connection not initialized. Using fallback data.');
    }

    if (!db) {
      // Mock fallback data if DB is offline
      return res.json({
        success: true,
        recruiters: [
          {
            id: 'mock_rec_1',
            email: 'hr@google.com',
            companyName: 'Google',
            verified: true,
            docUrl: 'https://aligngrade-storage-2026.s3.amazonaws.com/docs/google_verify.pdf',
            jobs: [
              { id: 'job_1', title: 'SWE Intern', description: 'Google Cloud console team internship.', salaryRange: '₹50,000 - ₹80,000 / month' },
              { id: 'job_2', title: 'Associate Product Manager', description: 'Work on consumer facing services.', salaryRange: '₹12,00,000 - ₹18,00,000 / year' }
            ]
          },
          {
            id: 'mock_rec_2',
            email: 'recruiting@microsoft.com',
            companyName: 'Microsoft',
            verified: false,
            docUrl: '',
            jobs: [
              { id: 'job_3', title: 'SRE Intern', description: 'Automating server monitoring systems.', salaryRange: '₹40,000 - ₹60,000 / month' }
            ]
          }
        ]
      });
    }

    const recruiters = await db.collection('User').find({ role: 'RECRUITER' }).toArray();
    if (recruiters.length === 0) {
      return res.json({ success: true, recruiters: [] });
    }

    const userIds = recruiters.map(r => r._id);
    const companies = await db.collection('Company').find({ userId: { $in: userIds } }).toArray();

    const companyIds = companies.map(c => c._id);
    const jobs = await db.collection('Job').find({ companyId: { $in: companyIds } }).toArray();

    const recruitersWithJobs = recruiters.map(recruiter => {
      const company = companies.find(c => c.userId.toString() === recruiter._id.toString());
      const companyJobs = company 
        ? jobs.filter(j => j.companyId.toString() === company._id.toString()).map(j => ({
            id: j._id.toString(),
            title: j.title,
            description: j.description,
            salaryRange: j.salaryRange || 'Not Specified',
            location: j.location || 'Remote',
            jobType: j.jobType || 'Full-time'
          }))
        : [];

      return {
        id: recruiter._id.toString(),
        email: recruiter.email,
        companyName: company?.name || 'Recruiter (No Company Profile)',
        verified: company?.verified || false,
        docUrl: company?.docUrl || '',
        jobs: companyJobs
      };
    });

    res.json({
      success: true,
      recruiters: recruitersWithJobs
    });
  } catch (err) {
    next(err);
  }
};
