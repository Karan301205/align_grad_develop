const { z } = require('zod');

const createCommunitySchema = z.object({
  name: z.string().min(3, 'Community name must be at least 3 characters.').max(100),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal('')),
  banner: z.string().url().optional().or(z.literal('')),
  password: z.string().min(4, 'Password must be at least 4 characters').optional().or(z.literal(''))
});

const joinCommunitySchema = z.object({
  password: z.string().optional()
});

const createInviteSchema = z.object({
  expiresInHours: z.number().positive().optional(),
  maxUses: z.number().positive().optional().nullable()
});

const createPostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty.').max(5000),
  postType: z.enum(['TEXT', 'IMAGE', 'MULTI_IMAGE', 'VIDEO', 'PDF']).default('TEXT'),
  mediaItems: z.array(
    z.object({
      s3Key: z.string(),
      url: z.string().url(),
      mediaType: z.enum(['IMAGE', 'VIDEO', 'PDF', 'THUMBNAIL']),
      mimeType: z.string(),
      sizeBytes: z.number(),
      durationSeconds: z.number().optional().nullable(),
      width: z.number().optional().nullable(),
      height: z.number().optional().nullable()
    })
  ).optional()
});

const editPostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty.').max(5000)
});

const reactPostSchema = z.object({
  type: z.enum(['LIKE', 'LOVE', 'CELEBRATE', 'INSIGHTFUL', 'SUPPORT', 'FUNNY']).default('LIKE')
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.').max(1000),
  parentCommentId: z.string().optional().nullable()
});

const requestMediaUrlSchema = z.object({
  mediaCategory: z.enum(['IMAGE', 'VIDEO', 'PDF', 'LOGO', 'BANNER']),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().positive()
});

module.exports = {
  createCommunitySchema,
  joinCommunitySchema,
  createInviteSchema,
  createPostSchema,
  editPostSchema,
  reactPostSchema,
  createCommentSchema,
  requestMediaUrlSchema
};
