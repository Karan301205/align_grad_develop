const { prisma: db } = require('../../config/db');

/**
 * Creates a comment or nested reply on a post.
 */
async function addComment(userId, userRole, postId, { content, parentCommentId = null }) {
  if (!content || !content.trim()) {
    throw new Error('Comment content cannot be empty.');
  }

  const post = await db.post.findUnique({
    where: { id: postId }
  });

  if (!post || post.deleted) {
    throw new Error('Post not found or deleted.');
  }

  if (parentCommentId) {
    const parentComment = await db.postComment.findUnique({
      where: { id: parentCommentId }
    });
    if (!parentComment || parentComment.deleted) {
      throw new Error('Parent comment not found or deleted.');
    }
  }

  const comment = await db.postComment.create({
    data: {
      postId,
      authorId: userId,
      authorRole: userRole || 'STUDENT',
      parentCommentId,
      content: content.trim(),
      deleted: false
    }
  });

  // Fetch author profile to return enriched response
  const authorProfile = await db.profile.findUnique({
    where: { userId }
  });

  return {
    ...comment,
    author: {
      id: userId,
      name: authorProfile?.name || 'User',
      username: authorProfile?.username || 'user',
      profilePic: authorProfile?.profilePic || null,
      role: userRole
    }
  };
}

/**
 * Gets paginated nested comment hierarchy for a post.
 */
async function getPostComments(postId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  // 1. Fetch non-deleted comments for post
  const [allComments, total] = await Promise.all([
    db.postComment.findMany({
      where: {
        postId,
        deleted: false
      },
      orderBy: { createdAt: 'asc' }
    }),
    db.postComment.count({
      where: {
        postId,
        deleted: false
      }
    })
  ]);

  if (allComments.length === 0) {
    return {
      comments: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 0
      }
    };
  }

  // 2. Fetch author profiles
  const authorIds = [...new Set(allComments.map(c => c.authorId))];
  const profiles = await db.profile.findMany({
    where: { userId: { in: authorIds } }
  });

  const profileMap = new Map();
  profiles.forEach(p => profileMap.set(p.userId, p));

  // Enrich comment objects
  const enrichedComments = allComments.map(c => {
    const author = profileMap.get(c.authorId) || {
      name: c.authorRole === 'RECRUITER' ? 'Recruiter' : 'Candidate',
      username: 'user',
      profilePic: null
    };

    return {
      ...c,
      author: {
        id: c.authorId,
        name: author.name,
        username: author.username,
        profilePic: author.profilePic,
        role: c.authorRole
      },
      replies: []
    };
  });

  // 3. Build recursive comment tree
  const commentMap = new Map();
  enrichedComments.forEach(c => commentMap.set(c.id, c));

  const rootComments = [];
  enrichedComments.forEach(c => {
    if (c.parentCommentId && commentMap.has(c.parentCommentId)) {
      commentMap.get(c.parentCommentId).replies.push(c);
    } else {
      rootComments.push(c);
    }
  });

  // Paginate top-level root comments
  const paginatedRoots = rootComments.slice(skip, skip + limit);

  return {
    comments: paginatedRoots,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: rootComments.length
    }
  };
}

/**
 * Soft delete a comment (`deleted = true`, `deletedAt`).
 */
async function deleteComment(userId, commentId) {
  const comment = await db.postComment.findUnique({
    where: { id: commentId }
  });

  if (!comment || comment.deleted) {
    throw new Error('Comment not found or already deleted.');
  }

  if (comment.authorId !== userId) {
    throw new Error('Unauthorized to delete this comment.');
  }

  const updated = await db.postComment.update({
    where: { id: commentId },
    data: {
      deleted: true,
      deletedAt: new Date()
    }
  });

  return updated;
}

module.exports = {
  addComment,
  getPostComments,
  deleteComment
};
