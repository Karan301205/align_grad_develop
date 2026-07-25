const { prisma: db } = require('../../config/db');

const ALLOWED_REACTIONS = ['LIKE', 'LOVE', 'CELEBRATE', 'INSIGHTFUL', 'SUPPORT', 'FUNNY'];

/**
 * Toggles a post reaction (Like, Love, Celebrate, Insightful, Support, Funny).
 * If user already reacted with the SAME type, removes it.
 * If user reacted with a DIFFERENT type, updates reaction type.
 * If user hasn't reacted, creates reaction.
 */
async function togglePostReaction(userId, postId, reactionType) {
  const type = reactionType ? reactionType.toUpperCase() : 'LIKE';
  if (!ALLOWED_REACTIONS.includes(type)) {
    throw new Error(`Invalid reaction type: ${reactionType}. Allowed: ${ALLOWED_REACTIONS.join(', ')}`);
  }

  const existing = await db.postReaction.findUnique({
    where: {
      postId_userId: { postId, userId }
    }
  });

  if (existing) {
    if (existing.type === type) {
      // Remove reaction
      await db.postReaction.delete({
        where: { id: existing.id }
      });
      return { action: 'removed', type: null };
    } else {
      // Update reaction type
      const updated = await db.postReaction.update({
        where: { id: existing.id },
        data: { type }
      });
      return { action: 'updated', type: updated.type };
    }
  }

  // Create new reaction
  const created = await db.postReaction.create({
    data: {
      postId,
      userId,
      type
    }
  });

  return { action: 'added', type: created.type };
}

module.exports = {
  ALLOWED_REACTIONS,
  togglePostReaction
};
