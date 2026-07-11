const { getDB } = require('../config/database');

exports.getAnalytics = async (req, res, next) => {
  try {
    let db;
    let isMock = false;

    try {
      db = getDB();
    } catch (e) {
      console.warn('[DB WARNING] Database connection not initialized. Using mockup analytics.');
      isMock = true;
    }

    let recruiterSkills = {};
    let studentSkills = {};

    if (!isMock && db) {
      try {
        // 1. Recruiter Skill Demands (from Job requirements)
        const jobs = await db.collection('Job').find({}).toArray();
        jobs.forEach(job => {
          if (Array.isArray(job.requirements)) {
            job.requirements.forEach(reqObj => {
              if (reqObj && reqObj.skillName) {
                const name = reqObj.skillName.trim();
                if (name) {
                  recruiterSkills[name] = (recruiterSkills[name] || 0) + 1;
                }
              }
            });
          }
        });

        // 2. Student Skill Preferences (from Profile skills)
        const profiles = await db.collection('Profile').find({}).toArray();
        profiles.forEach(profile => {
          if (Array.isArray(profile.skills)) {
            profile.skills.forEach(skillObj => {
              if (skillObj && skillObj.name) {
                const name = skillObj.name.trim();
                if (name) {
                  studentSkills[name] = (studentSkills[name] || 0) + 1;
                }
              }
            });
          }
        });
      } catch (err) {
        console.warn('[MONGO WARNING] Failed fetching analytics data, reverting to mocks:', err.message);
        isMock = true;
      }
    }

    // Helper to format and sort rankings
    const formatRankings = (skillsMap, totalCount) => {
      return Object.entries(skillsMap)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    };

    let recruiterRankings = [];
    let studentRankings = [];

    if (isMock || Object.keys(recruiterSkills).length === 0) {
      // Mock Recruiters Demands
      const mockRecDemand = {
        'React': 8,
        'Node.js': 7,
        'SQL': 6,
        'Python': 5,
        'TypeScript': 4,
        'AWS': 3,
        'Docker': 3,
        'MongoDB': 2,
        'Figma': 2,
        'Java': 1
      };
      const totalRec = Object.values(mockRecDemand).reduce((acc, v) => acc + v, 0);
      recruiterRankings = formatRankings(mockRecDemand, totalRec);
    } else {
      const totalRec = Object.values(recruiterSkills).reduce((acc, v) => acc + v, 0);
      recruiterRankings = formatRankings(recruiterSkills, totalRec);
    }

    if (isMock || Object.keys(studentSkills).length === 0) {
      // Mock Students Preferences
      const mockStuPref = {
        'Python': 7,
        'JavaScript': 6,
        'React': 5,
        'HTML/CSS': 5,
        'SQL': 4,
        'C++': 3,
        'Java': 3,
        'Node.js': 2,
        'Git': 2,
        'Tailwind': 1
      };
      const totalStu = Object.values(mockStuPref).reduce((acc, v) => acc + v, 0);
      studentRankings = formatRankings(mockStuPref, totalStu);
    } else {
      const totalStu = Object.values(studentSkills).reduce((acc, v) => acc + v, 0);
      studentRankings = formatRankings(studentSkills, totalStu);
    }

    res.json({
      success: true,
      recruiterSkills: recruiterRankings,
      studentSkills: studentRankings,
      isMock
    });

  } catch (err) {
    next(err);
  }
};
