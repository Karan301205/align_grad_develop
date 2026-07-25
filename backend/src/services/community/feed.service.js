const { prisma: db } = require('../../config/db');

/**
 * Retrieves chronological feed of posts for a community (Newest First).
 * Enriched with author details, media, reactions summary, user reaction status, comment count, and unique view count.
 */
async function getCommunityFeed(userId, communityId, { page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  // 1. Fetch non-deleted posts
  const [posts, total] = await Promise.all([
    db.post.findMany({
      where: {
        communityId,
        deleted: false
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.post.count({
      where: {
        communityId,
        deleted: false
      }
    })
  ]);

  if (posts.length === 0) {
    return {
      posts: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    };
  }

  const postIds = posts.map(p => p.id);
  const authorIds = [...new Set(posts.map(p => p.authorId))];

  // 2. Fetch author profiles, media, reactions, comments, bookmarks, and views in parallel
  const [profiles, mediaList, reactions, comments, bookmarks, views] = await Promise.all([
    db.profile.findMany({
      where: { userId: { in: authorIds } }
    }),
    db.media.findMany({
      where: { postId: { in: postIds } }
    }),
    db.postReaction.findMany({
      where: { postId: { in: postIds } }
    }),
    db.postComment.findMany({
      where: { postId: { in: postIds }, deleted: false }
    }),
    db.savedPost.findMany({
      where: { userId, postId: { in: postIds } }
    }),
    db.postView.findMany({
      where: { postId: { in: postIds } }
    })
  ]);

  // Map author profiles
  const profileMap = new Map();
  profiles.forEach(p => profileMap.set(p.userId, p));

  // Map media by postId
  const mediaMap = new Map();
  mediaList.forEach(m => {
    if (!mediaMap.has(m.postId)) mediaMap.set(m.postId, []);
    mediaMap.get(m.postId).push(m);
  });

  // Map reactions summary and user reaction
  const reactionsMap = new Map();
  reactions.forEach(r => {
    if (!reactionsMap.has(r.postId)) {
      reactionsMap.set(r.postId, { total: 0, byType: {}, userReaction: null });
    }
    const rec = reactionsMap.get(r.postId);
    rec.total += 1;
    rec.byType[r.type] = (rec.byType[r.type] || 0) + 1;
    if (r.userId === userId) {
      rec.userReaction = r.type;
    }
  });

  // Map comment counts
  const commentCountMap = new Map();
  comments.forEach(c => {
    commentCountMap.set(c.postId, (commentCountMap.get(c.postId) || 0) + 1);
  });

  // Map user bookmarks
  const bookmarkSet = new Set(bookmarks.map(b => b.postId));

  // Map unique view counts
  const viewCountMap = new Map();
  views.forEach(v => {
    viewCountMap.set(v.postId, (viewCountMap.get(v.postId) || 0) + 1);
  });

  // 3. Assemble enriched post list
  const enrichedPosts = posts.map(post => {
    const author = profileMap.get(post.authorId) || {
      name: post.authorRole === 'RECRUITER' ? 'Recruiter' : 'Candidate',
      username: 'user',
      profilePic: null
    };

    const reactionData = reactionsMap.get(post.id) || { total: 0, byType: {}, userReaction: null };

    return {
      ...post,
      author: {
        id: post.authorId,
        name: author.name,
        username: author.username,
        profilePic: author.profilePic,
        role: post.authorRole
      },
      media: mediaMap.get(post.id) || [],
      reactionsCount: reactionData.total,
      reactionsByType: reactionData.byType,
      userReaction: reactionData.userReaction,
      commentsCount: commentCountMap.get(post.id) || 0,
      isSaved: bookmarkSet.has(post.id),
      uniqueViewsCount: viewCountMap.get(post.id) || 0
    };
  });

  return {
    posts: enrichedPosts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total
    }
  };
}

module.exports = {
  getCommunityFeed
};
