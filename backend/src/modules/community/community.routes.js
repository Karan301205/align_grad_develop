const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { relaxedLimit } = require('../../middleware/rateLimiter');
const validate = require('../../middleware/validate');
const communityController = require('./community.controller');
const {
  createCommunitySchema,
  joinCommunitySchema,
  createInviteSchema,
  createPostSchema,
  editPostSchema,
  requestMediaUrlSchema,
  reactPostSchema,
  createCommentSchema
} = require('./community.validator');

// Community Management Routes
router.get('/', authMiddleware, relaxedLimit, communityController.getCommunities);
router.get('/search', authMiddleware, relaxedLimit, communityController.searchCommunities);
router.post('/', authMiddleware, relaxedLimit, validate(createCommunitySchema), communityController.createCommunity);
router.post('/:id/join', authMiddleware, relaxedLimit, validate(joinCommunitySchema), communityController.joinCommunity);
router.delete('/:id', authMiddleware, relaxedLimit, communityController.deleteCommunity);
router.post('/:id/invite', authMiddleware, relaxedLimit, validate(createInviteSchema), communityController.createInviteLink);
router.post('/invite/:token/join', authMiddleware, relaxedLimit, communityController.joinViaInvite);

// Community Feed & Post Routes
router.get('/:id/feed', authMiddleware, relaxedLimit, communityController.getCommunityFeed);
router.post('/:id/posts', authMiddleware, relaxedLimit, validate(createPostSchema), communityController.createPost);
router.put('/posts/:postId', authMiddleware, relaxedLimit, validate(editPostSchema), communityController.editPost);
router.delete('/posts/:postId', authMiddleware, relaxedLimit, communityController.deletePost);

// Community Media Route
router.post('/media/upload-url', authMiddleware, relaxedLimit, validate(requestMediaUrlSchema), communityController.requestMediaUploadUrl);

// Community Interactions Routes
router.post('/posts/:postId/react', authMiddleware, relaxedLimit, validate(reactPostSchema), communityController.toggleReaction);
router.get('/posts/:postId/comments', authMiddleware, relaxedLimit, communityController.getPostComments);
router.post('/posts/:postId/comments', authMiddleware, relaxedLimit, validate(createCommentSchema), communityController.addComment);
router.delete('/comments/:commentId', authMiddleware, relaxedLimit, communityController.deleteComment);
router.post('/posts/:postId/bookmark', authMiddleware, relaxedLimit, communityController.toggleBookmark);
router.get('/bookmarks', authMiddleware, relaxedLimit, communityController.getSavedPosts);
router.post('/posts/:postId/view', authMiddleware, relaxedLimit, communityController.recordView);

module.exports = router;
