const { prisma } = require('../../infrastructure/database');

// The ids a user can appear under on gig rows: their User id, plus their Profile id
// (students) or Company id (recruiters) for rows written before ids were unified.
// Shared by the gig HTTP handlers and the realtime chat notifications.
async function identityIds(user) {
  const ids = [user.id];
  if (user.role === 'STUDENT') {
    const profile = await prisma.profile.findFirst({ where: { OR: [{ userId: user.id }, { id: user.id }] } });
    if (profile) ids.push(profile.id, profile.userId);
  } else if (user.role === 'RECRUITER') {
    const company = await prisma.company.findFirst({ where: { OR: [{ userId: user.id }, { id: user.id }] } });
    if (company) ids.push(company.id, company.userId);
  }
  return Array.from(new Set(ids.filter(Boolean)));
}

module.exports = { identityIds };
