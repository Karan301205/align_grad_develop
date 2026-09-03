const { prisma: db } = require('../../../infrastructure/database');
const { ROLES, ACTIONS, hasPermission } = require('./permission.engine');

/**
 * Creates a post in a community with optional linked Media records.
 */
async function createPost(userId, userRole, communityId, { content, postType = 'TEXT', mediaItems = [] }) {
  // Check membership / permission
  let memberRole = ROLES.MEMBER;
  const community = await db.community.findUnique({
    where: { id: communityId }
  });

  if (!community || community.deleted) {
    throw new Error('Target community does not exist.');
  }

  if (community.type === 'GLOBAL') {
    memberRole = ROLES.MEMBER;
  } else {
    const member = await db.communityMember.findUnique({
      where: {
        communityId_userId: { communityId, userId }
      }
    });

    if (!member) {
      throw new Error('You must be a member of this community to create posts.');
    }
    memberRole = member.role;
  }

  if (!hasPermission(memberRole, ACTIONS.POST_CREATE)) {
    throw new Error('Unauthorized to post in this community.');
  }

  // Create post record
  const post = await db.post.create({
    data: {
      authorId: userId,
      authorRole: userRole || 'STUDENT',
      communityId,
      content,
      postType,
      edited: false,
      deleted: false
    }
  });

  // Create associated Media records if provided
  const createdMedia = [];
  if (Array.isArray(mediaItems) && mediaItems.length > 0) {
    for (const item of mediaItems) {
      if (item.s3Key && item.url) {
        const media = await db.media.create({
          data: {
            postId: post.id,
            s3Key: item.s3Key,
            url: item.url,
            mediaType: item.mediaType || 'IMAGE',
            mimeType: item.mimeType || 'image/png',
            sizeBytes: item.sizeBytes || 0,
            durationSeconds: item.durationSeconds || null,
            width: item.width || null,
            height: item.height || null
          }
        });
        createdMedia.push(media);
      }
    }
  }

  return {
    ...post,
    media: createdMedia
  };
}

/**
 * Edit post content (Author only or Admin/Owner).
 */
async function editPost(userId, postId, { content }) {
  const post = await db.post.findUnique({
    where: { id: postId }
  });

  if (!post || post.deleted) {
    throw new Error('Post not found or deleted.');
  }

  // Check if author or admin/owner
  let canEdit = post.authorId === userId;
  if (!canEdit) {
    const member = await db.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: post.communityId, userId }
      }
    });
    if (member && hasPermission(member.role, ACTIONS.POST_EDIT_ANY)) {
      canEdit = true;
    }
  }

  if (!canEdit) {
    throw new Error('Unauthorized to edit this post.');
  }

  const updated = await db.post.update({
    where: { id: postId },
    data: {
      content,
      edited: true
    }
  });

  return updated;
}

/**
 * Soft delete a post (`deleted = true`, `deletedAt`).
 */
async function deletePost(userId, postId) {
  const post = await db.post.findUnique({
    where: { id: postId }
  });

  if (!post || post.deleted) {
    throw new Error('Post not found or already deleted.');
  }

  let canDelete = post.authorId === userId;
  if (!canDelete) {
    const member = await db.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: post.communityId, userId }
      }
    });
    if (member && hasPermission(member.role, ACTIONS.POST_DELETE_ANY)) {
      canDelete = true;
    }
  }

  if (!canDelete) {
    throw new Error('Unauthorized to delete this post.');
  }

  const updated = await db.post.update({
    where: { id: postId },
    data: {
      deleted: true,
      deletedAt: new Date()
    }
  });

  return updated;
}

module.exports = {
  createPost,
  editPost,
  deletePost
};
