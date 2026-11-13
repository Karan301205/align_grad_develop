const { getDB } = require('../../config/database');

// Counts how often each skill name appears in a JSON array column.
function countSkills(rows, column, nameKey) {
  const counts = {};
  rows.forEach((row) => {
    if (!Array.isArray(row[column])) return;
    row[column].forEach((item) => {
      const name = item && typeof item[nameKey] === 'string' ? item[nameKey].trim() : '';
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
  });
  return counts;
}

// Sorted rankings with each skill's share of the total.
function formatRankings(skillsMap) {
  const total = Object.values(skillsMap).reduce((sum, count) => sum + count, 0);
  return Object.entries(skillsMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Skills recruiters ask for (Job requirements) and skills students list (Profile
// skills). Only real rows are counted: an empty table gives an empty ranking, and a
// database failure is passed to the error handler.
exports.getAnalytics = async (req, res, next) => {
  try {
    const db = getDB();
    const { rows: jobs } = await db.query('SELECT "requirements" FROM "Job"');
    const { rows: profiles } = await db.query('SELECT "skills" FROM "Profile"');

    res.json({
      success: true,
      recruiterSkills: formatRankings(countSkills(jobs, 'requirements', 'skillName')),
      studentSkills: formatRankings(countSkills(profiles, 'skills', 'name'))
    });
  } catch (err) {
    next(err);
  }
};
