const { getUploadUrl, getPublicUrl } = require('../../../infrastructure/storage/s3');

const MEDIA_RULES = {
  IMAGE: {
    allowedMimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    maxCountPerPost: 9,
    s3Folder: 'communities/posts/images'
  },
  VIDEO: {
    allowedMimes: ['video/mp4', 'video/quicktime', 'video/webm'],
    maxSizeBytes: 100 * 1024 * 1024, // 100 MB
    maxDurationSeconds: 90,
    maxCountPerPost: 1,
    s3Folder: 'communities/posts/videos'
  },
  PDF: {
    allowedMimes: ['application/pdf'],
    maxSizeBytes: 20 * 1024 * 1024, // 20 MB
    maxCountPerPost: 1,
    s3Folder: 'communities/posts/pdfs'
  },
  LOGO: {
    allowedMimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSizeBytes: 5 * 1024 * 1024,
    s3Folder: 'communities/logos'
  },
  BANNER: {
    allowedMimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSizeBytes: 10 * 1024 * 1024,
    s3Folder: 'communities/banners'
  }
};

/**
 * Validates file upload metadata and generates presigned S3 upload URL.
 */
async function generateMediaUploadUrl({ mediaCategory, fileName, contentType, sizeBytes }) {
  const rule = MEDIA_RULES[mediaCategory];
  if (!rule) {
    throw new Error(`Invalid media category: ${mediaCategory}`);
  }

  if (!rule.allowedMimes.includes(contentType)) {
    throw new Error(`File format '${contentType}' is not supported for ${mediaCategory}. Allowed: ${rule.allowedMimes.join(', ')}`);
  }

  if (sizeBytes && sizeBytes > rule.maxSizeBytes) {
    const maxMb = rule.maxSizeBytes / (1024 * 1024);
    throw new Error(`File size exceeds maximum allowed limit of ${maxMb} MB for ${mediaCategory}.`);
  }

  const cleanFileName = fileName ? fileName.replace(/[^a-zA-Z0-9_.-]/g, '_') : 'file';
  const key = `${rule.s3Folder}/${Date.now()}_${cleanFileName}`;

  const uploadUrl = await getUploadUrl(key, contentType, 300);
  const publicUrl = getPublicUrl(key);

  return {
    uploadUrl,
    publicUrl,
    s3Key: key,
    mediaCategory
  };
}

module.exports = {
  MEDIA_RULES,
  generateMediaUploadUrl
};
