const { prisma: db } = require('../../../infrastructure/database');

/**
 * Toggles a saved post bookmark for a user.
 */
async function togglePostBookmark(userId, postId) {
  const existing = await db.savedPost.findUnique({
    where: {
      userId_postId: { userId, postId }
    }
  });

  if (existing) {
    await db.savedPost.delete({
      where: { id: existing.id }
    });
    return { isSaved: false, message: 'Post removed from saved bookmarks.' };
  }

  await db.savedPost.create({
    data: {
      userId,
      postId
    }
  });

  return { isSaved: true, message: 'Post saved to bookmarks.' };
}

/**
 * Gets paginated list of user's saved bookmarked posts.
 */
async function getUserSavedPosts(userId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  const [bookmarks, total] = await Promise.all([
    db.savedPost.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.savedPost.count({ where: { userId } })
  ]);

  const postIds = bookmarks.map(b => b.postId);
  if (postIds.length === 0) {
    return {
      posts: [],
      pagination: { page: Number(page), limit: Number(limit), total: 0 }
    };
  }

  const posts = await db.post.findMany({
    where: {
      id: { in: postIds },
      deleted: false
    }
  });

  return {
    posts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total
    }
  };
}

module.exports = {
  togglePostBookmark,
  getUserSavedPosts
};
