const { getDbSafe } = require('../config/database');

exports.getAllStudents = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) {
      console.warn('[DB WARNING] Database connection not initialized. Using fallback data.');
    }

    if (!db) {
      // Mock fallback data if DB is offline
      return res.json({
        success: true,
        students: [
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
          },
          {
            id: 'mock_2',
            email: 'kirti@yahoo.com',
            name: 'Kirti Sen',
            username: 'kirti_sen',
            bio: 'DevOps professional passionate about CI/CD pipelines, containerization, and automation.',
            nationality: 'India',
            gender: 'Female',
            phone: '8765432109',
            dob: '1999-11-20',
            skills: [{ name: 'Python', rating: 8 }, { name: 'Docker', rating: 9 }],
            education: [{ institute: 'BITS Pilani', degree: 'M.Sc', fieldOfStudy: 'Software Systems' }],
            experience: [{ companyName: 'Microsoft', designation: 'SRE Intern', description: 'Automated server monitoring systems.' }],
            certificates: [{ title: 'Certified Kubernetes Administrator', org: 'CNCF' }],
            projects: [{ title: 'Kubernetes GitOps', role: 'DevOps Engineer', description: 'Setup CD pipeline with ArgoCD.' }],
            cocurricular: [],
            introVideoUrl: ''
          }
        ]
      });
    }

    const students = await db.collection('User').find({ role: 'STUDENT' }).toArray();
    if (students.length === 0) {
      return res.json({ success: true, students: [] });
    }

    const userIds = students.map(s => s._id);
    const profiles = await db.collection('Profile').find({ userId: { $in: userIds } }).toArray();

    const studentsWithProfiles = students.map(student => {
      const profile = profiles.find(p => p.userId.toString() === student._id.toString());
      return {
        id: student._id.toString(),
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
