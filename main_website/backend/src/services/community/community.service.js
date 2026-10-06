const bcrypt = require('bcryptjs');
const { prisma: db } = require('../../config/db');
const { ROLES, ACTIONS, hasPermission } = require('./permission.engine');

const GLOBAL_COMMUNITY_ID = '64a000000000000000000001';

/**
 * Ensures the single Global Community exists at system boot.
 * Every user automatically becomes a member of the Global Community.
 */
async function ensureGlobalCommunity() {
  try {
    let globalComm = await db.community.findFirst({
      where: { type: 'GLOBAL', deleted: false }
    });

    if (!globalComm) {
      // Find system admin user or fallback
      const adminUser = await db.user.findFirst();
      const ownerId = adminUser ? adminUser.id : '64a000000000000000000002';

      globalComm = await db.community.create({
        data: {
          id: GLOBAL_COMMUNITY_ID,
          name: 'AlignGrade Global Community',
          description: 'Official global ecosystem for candidates, recruiters, and engineering leaders to collaborate, share verified proficiencies, and discuss career opportunities.',
          type: 'GLOBAL',
          ownerId,
          deleted: false
        }
      });
      console.log('✔ Global Community initialized successfully.');
    }

    return globalComm;
  } catch (err) {
    console.error('Error initializing Global Community:', err);
    return null;
  }
}

/**
 * List communities accessible to a user (Global + Private joined communities).
 */
async function getAccessibleCommunities(userId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  // 1. Get Global Community
  const globalComm = await db.community.findFirst({
    where: { type: 'GLOBAL', deleted: false }
  });

  // 2. Get user's membership records
  const memberships = await db.communityMember.findMany({
    where: { userId }
  });

  const joinedCommunityIds = memberships.map(m => m.communityId);

  // 3. Query private communities user belongs to
  const [privateCommunities, totalPrivate] = await Promise.all([
    db.community.findMany({
      where: {
        id: { in: joinedCommunityIds },
        type: 'PRIVATE',
        deleted: false
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.community.count({
      where: {
        id: { in: joinedCommunityIds },
        type: 'PRIVATE',
        deleted: false
      }
    })
  ]);

  const allCommunities = [];
  if (globalComm && page === 1) {
    allCommunities.push({
      ...globalComm,
      isMember: true,
      role: ROLES.MEMBER
    });
  }

  const enrichedPrivate = privateCommunities.map(c => {
    const mem = memberships.find(m => m.communityId === c.id);
    return {
      ...c,
      isMember: true,
      role: mem ? mem.role : ROLES.MEMBER
    };
  });

  allCommunities.push(...enrichedPrivate);

  return {
    communities: allCommunities,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalPrivate + (globalComm ? 1 : 0)
    }
  };
}

/**
 * Search public/discoverable communities by name or description.
 */
async function searchCommunities(query = '', { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  const whereClause = {
    deleted: false,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  const [communities, total] = await Promise.all([
    db.community.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.community.count({ where: whereClause })
  ]);

  // Remove passwordHash before returning
  const sanitized = communities.map(({ passwordHash, ...c }) => c);

  return {
    communities: sanitized,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total
    }
  };
}

/**
 * Create a new private community.
 */
async function createCommunity(userId, { name, description, logo, banner, password }) {
  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const community = await db.community.create({
    data: {
      name,
      description,
      logo,
      banner,
      type: 'PRIVATE',
      passwordHash,
      ownerId: userId,
      deleted: false
    }
  });

  // Add creator as OWNER in CommunityMember
  await db.communityMember.create({
    data: {
      communityId: community.id,
      userId,
      role: ROLES.OWNER
    }
  });

  const { passwordHash: _, ...sanitized } = community;
  return { ...sanitized, isMember: true, role: ROLES.OWNER };
}

/**
 * Join a private community with password verification.
 */
async function joinCommunityWithPassword(userId, communityId, password) {
  const community = await db.community.findUnique({
    where: { id: communityId }
  });

  if (!community || community.deleted) {
    throw new Error('Community not found');
  }

  if (community.type === 'GLOBAL') {
    return { message: 'You are automatically a member of the Global Community.' };
  }

  // Check if already a member
  const existingMember = await db.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId }
    }
  });

  if (existingMember) {
    return { message: 'Already a member of this community.' };
  }

  if (community.passwordHash) {
    if (!password) {
      throw new Error('Community password is required.');
    }
    const isValid = await bcrypt.compare(password, community.passwordHash);
    if (!isValid) {
      throw new Error('Invalid community password.');
    }
  }

  await db.communityMember.create({
    data: {
      communityId,
      userId,
      role: ROLES.MEMBER
    }
  });

  return { message: 'Successfully joined community.', communityId };
}

/**
 * Soft delete a community (Owner only).
 */
async function softDeleteCommunity(userId, communityId) {
  const member = await db.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId }
    }
  });

  if (!member || !hasPermission(member.role, ACTIONS.COMMUNITY_DELETE)) {
    throw new Error('Unauthorized to delete this community');
  }

  const updated = await db.community.update({
    where: { id: communityId },
    data: {
      deleted: true,
      deletedAt: new Date()
    }
  });

  return updated;
}

module.exports = {
  GLOBAL_COMMUNITY_ID,
  ensureGlobalCommunity,
  getAccessibleCommunities,
  searchCommunities,
  createCommunity,
  joinCommunityWithPassword,
  softDeleteCommunity
};
