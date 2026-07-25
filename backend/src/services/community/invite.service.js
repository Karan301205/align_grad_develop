const crypto = require('crypto');
const { prisma: db } = require('../../config/db');
const { ROLES, ACTIONS, hasPermission } = require('./permission.engine');

/**
 * Creates an invitation link token for a private community.
 */
async function createInviteLink(userId, communityId, { expiresInHours = 48, maxUses = null } = {}) {
  const member = await db.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId }
    }
  });

  if (!member || !hasPermission(member.role, ACTIONS.INVITE_CREATE)) {
    throw new Error('Unauthorized to generate invite links for this community.');
  }

  const token = crypto.randomBytes(16).toString('hex');
  const expirationDate = expiresInHours ? new Date(Date.now() + expiresInHours * 3600 * 1000) : null;

  const invite = await db.communityInvite.create({
    data: {
      communityId,
      token,
      expirationDate,
      maxUses: maxUses ? Number(maxUses) : null,
      useCount: 0,
      isActive: true,
      createdById: userId
    }
  });

  return invite;
}

/**
 * Joins a community using an invitation link token.
 */
async function joinViaInvite(userId, token) {
  const invite = await db.communityInvite.findUnique({
    where: { token }
  });

  if (!invite || !invite.isActive) {
    throw new Error('Invalid or inactive invitation link.');
  }

  if (invite.expirationDate && new Date() > new Date(invite.expirationDate)) {
    await db.communityInvite.update({
      where: { id: invite.id },
      data: { isActive: false }
    });
    throw new Error('Invitation link has expired.');
  }

  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    await db.communityInvite.update({
      where: { id: invite.id },
      data: { isActive: false }
    });
    throw new Error('Invitation link has reached maximum usage limit.');
  }

  // Check existing membership
  const existingMember = await db.communityMember.findUnique({
    where: {
      communityId_userId: { communityId: invite.communityId, userId }
    }
  });

  if (existingMember) {
    return { message: 'Already a member of this community.', communityId: invite.communityId };
  }

  // Add user to community
  await db.communityMember.create({
    data: {
      communityId: invite.communityId,
      userId,
      role: ROLES.MEMBER
    }
  });

  // Increment invite usage
  const updatedCount = invite.useCount + 1;
  const isNowInactive = invite.maxUses !== null && updatedCount >= invite.maxUses;

  await db.communityInvite.update({
    where: { id: invite.id },
    data: {
      useCount: updatedCount,
      isActive: !isNowInactive
    }
  });

  return { message: 'Successfully joined community via invite link.', communityId: invite.communityId };
}

module.exports = {
  createInviteLink,
  joinViaInvite
};
