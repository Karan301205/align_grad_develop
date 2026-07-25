const { prisma: db } = require('../../config/db');

/**
 * Records a unique post view for a user.
 * Ignores duplicate view attempts by the same user.
 */
async function recordUniqueView(userId, postId) {
  try {
    const existing = await db.postView.findUnique({
      where: {
        postId_userId: { postId, userId }
      }
    });

    if (existing) {
      return { isNewView: false };
    }

    await db.postView.create({
      data: {
        postId,
        userId
      }
    });

    return { isNewView: true };
  } catch (err) {
    // Unique constraint violation handle safely
    return { isNewView: false };
  }
}

module.exports = {
  recordUniqueView
};
