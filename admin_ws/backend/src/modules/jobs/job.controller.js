const { getDbSafe } = require('../../config/database');
const { ObjectId } = require('mongodb');

exports.getAllJobs = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) {
      console.warn('[DB WARNING] Database connection not initialized. Using fallback data.');
    }

    if (!db) {
      // Mock fallback data if DB is offline
      return res.json({
        success: true,
        jobs: [
          {
            id: 'job_1',
            title: 'SWE Intern',
            description: 'Google Cloud console team internship. Work on building dashboards, API integration, and monitoring widgets.',
            companyName: 'Google',
            location: 'Remote',
            salaryRange: '₹50,000 - ₹80,000 / month',
            jobType: 'Full-time',
            requirements: [{ skill: 'React', rating: 7 }, { skill: 'Node.js', rating: 7 }]
          },
          {
            id: 'job_2',
            title: 'Associate Product Manager',
            description: 'Work on consumer facing services. Coordinate between development and design teams.',
            companyName: 'Google',
            location: 'Bangalore, India',
            salaryRange: '₹12,00,000 - ₹18,00,000 / year',
            jobType: 'Full-time',
            requirements: [{ skill: 'Communication', rating: 8 }]
          },
          {
            id: 'job_3',
            title: 'SRE Intern',
            description: 'Automating server monitoring systems. Setup alert notifications and recovery scripts.',
            companyName: 'Microsoft',
            location: 'Hyderabad, India',
            salaryRange: '₹40,000 - ₹60,000 / month',
            jobType: 'Internship',
            requirements: [{ skill: 'Python', rating: 8 }, { skill: 'Docker', rating: 9 }]
          }
        ]
      });
    }

    const jobs = await db.collection('Job').find({}).toArray();
    const companyIds = jobs.map(j => j.companyId);
    const companies = await db.collection('Company').find({ _id: { $in: companyIds } }).toArray();

    const jobsWithCompany = jobs.map(job => {
      const company = companies.find(c => c._id.toString() === job.companyId.toString());
      return {
        id: job._id.toString(),
        title: job.title,
        description: job.description,
        companyName: company?.name || job.companyName || 'Not Specified',
        location: job.location || 'Remote',
        salaryRange: job.salaryRange || 'Not Specified',
        jobType: job.jobType || 'Full-time',
        requirements: job.requirements || []
      };
    });

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
    const db = getDbSafe();
    if (!db) {
      console.warn('[DB WARNING] Database connection not initialized. Using fallback data.');
    }

    if (!db) {
      // Mock fallback data if DB is offline
      if (jobId === 'job_1') {
        return res.json({
          success: true,
          applicants: [
            {
              id: 'mock_1',
              email: 'aravind@gmail.com',
              name: 'Aravind Sharma',
              username: 'aravind_s',
              bio: 'Software engineer focusing on full-stack development using Node.js and React.',
              nationality: 'India',
              gender: 'Male',
              phone: '9876543210',
              dob: '2000-05-15',
              skills: [{ name: 'React', rating: 8 }, { name: 'Node.js', rating: 7 }],
              education: [{ institute: 'IIT Delhi', degree: 'B.Tech', fieldOfStudy: 'Computer Science' }],
              experience: [{ companyName: 'Google', designation: 'SWE Intern', description: 'Worked on Google Cloud console.' }],
              certificates: [{ title: 'AWS Cloud Practitioner', org: 'Amazon Web Services' }],
              projects: [{ title: 'E-commerce API', role: 'Backend Lead', description: 'Developed REST API with express.' }],
              cocurricular: [{ activity: 'Hackathon Coordinator', description: 'Organized national level coding event.' }],
              introVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
            }
          ]
        });
      }
      return res.json({ success: true, applicants: [] });
    }

    // Fetch applications
    let jobObjectId;
    try {
      jobObjectId = new ObjectId(jobId);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid Job ID format' });
    }

    const applications = await db.collection('Application').find({ jobId: jobObjectId }).toArray();
    if (applications.length === 0) {
      return res.json({ success: true, applicants: [] });
    }

    const studentIds = applications.map(app => app.studentId);
    const users = await db.collection('User').find({ _id: { $in: studentIds } }).toArray();
    const profiles = await db.collection('Profile').find({ userId: { $in: studentIds } }).toArray();

    const applicants = users.map(user => {
      const profile = profiles.find(p => p.userId.toString() === user._id.toString());
      return {
        id: user._id.toString(),
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
