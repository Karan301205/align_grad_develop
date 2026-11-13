const communityService = require('./services/community.service');
const inviteService = require('./services/invite.service');
const postService = require('./services/post.service');
const feedService = require('./services/feed.service');
const mediaService = require('./services/media.service');
const reactionService = require('./services/reaction.service');
const commentService = require('./services/comment.service');
const bookmarkService = require('./services/bookmark.service');
const viewService = require('./services/view.service');
const { sendError } = require('../../shared/http/sendError');

// 1. Communities Controller Handlers
exports.getCommunities = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await communityService.getAccessibleCommunities(req.user.id, { page, limit });
    res.json(result);
  } catch (err) {
    sendError(res, err, 500, 'Error fetching communities');
  }
};

exports.searchCommunities = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const q = req.query.q || '';
    const result = await communityService.searchCommunities(q, { page, limit });
    res.json(result);
  } catch (err) {
    sendError(res, err, 500, 'Error searching communities');
  }
};

exports.createCommunity = async (req, res) => {
  try {
    const community = await communityService.createCommunity(req.user.id, req.body);
    res.status(201).json(community);
  } catch (err) {
    sendError(res, err, 400, 'Error creating community');
  }
};

exports.joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const result = await communityService.joinCommunityWithPassword(req.user.id, id, password);
    res.json(result);
  } catch (err) {
    sendError(res, err, 400, 'Failed to join community');
  }
};

exports.deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await communityService.softDeleteCommunity(req.user.id, id);
    res.json({ message: 'Community deleted successfully.', result });
  } catch (err) {
    sendError(res, err, 403, 'Unauthorized to delete community');
  }
};

// 2. Invites Controller Handlers
exports.createInviteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const invite = await inviteService.createInviteLink(req.user.id, id, req.body);
    res.status(201).json(invite);
  } catch (err) {
    sendError(res, err, 400, 'Error creating invite link');
  }
};

exports.joinViaInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await inviteService.joinViaInvite(req.user.id, token);
    res.json(result);
  } catch (err) {
    sendError(res, err, 400, 'Error joining community via invite');
  }
};

// 3. Feed & Posts Controller Handlers
exports.getCommunityFeed = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const result = await feedService.getCommunityFeed(req.user.id, id, { page, limit });
    res.json(result);
  } catch (err) {
    sendError(res, err, 500, 'Error fetching feed');
  }
};

exports.createPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postService.createPost(req.user.id, req.user.role, id, req.body);
    res.status(201).json(post);
  } catch (err) {
    sendError(res, err, 400, 'Error creating post');
  }
};

exports.editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const updated = await postService.editPost(req.user.id, postId, req.body);
    res.json(updated);
  } catch (err) {
    sendError(res, err, 400, 'Error updating post');
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await postService.deletePost(req.user.id, postId);
    res.json({ message: 'Post deleted successfully.', result });
  } catch (err) {
    sendError(res, err, 403, 'Unauthorized to delete post');
  }
};

// 4. Media Presigned URL Handler
exports.requestMediaUploadUrl = async (req, res) => {
  try {
    const result = await mediaService.generateMediaUploadUrl(req.body);
    res.json(result);
  } catch (err) {
    sendError(res, err, 400, 'Error generating upload URL');
  }
};

// 5. Engagement Controller Handlers
exports.toggleReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { type } = req.body;
    const result = await reactionService.togglePostReaction(req.user.id, postId, type);
    res.json(result);
  } catch (err) {
    sendError(res, err, 400, 'Error toggling reaction');
  }
};

exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const result = await commentService.getPostComments(postId, { page, limit });
    res.json(result);
  } catch (err) {
    sendError(res, err, 500, 'Error fetching comments');
  }
};

exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const comment = await commentService.addComment(req.user.id, req.user.role, postId, req.body);
    res.status(201).json(comment);
  } catch (err) {
    sendError(res, err, 400, 'Error adding comment');
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const result = await commentService.deleteComment(req.user.id, commentId);
    res.json({ message: 'Comment deleted successfully.', result });
  } catch (err) {
    sendError(res, err, 403, 'Unauthorized to delete comment');
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await bookmarkService.togglePostBookmark(req.user.id, postId);
    res.json(result);
  } catch (err) {
    sendError(res, err, 400, 'Error toggling bookmark');
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await bookmarkService.getUserSavedPosts(req.user.id, { page, limit });
    res.json(result);
  } catch (err) {
    sendError(res, err, 500, 'Error fetching saved posts');
  }
};

exports.recordView = async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await viewService.recordUniqueView(req.user.id, postId);
    res.json(result);
  } catch (err) {
    sendError(res, err, 400, 'Error recording view');
  }
};
