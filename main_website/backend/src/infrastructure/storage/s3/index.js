const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const env = require('../../../config/env');

const bucketName = env.S3_BUCKET_NAME;
const region = env.AWS_REGION;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Generates a pre-signed URL to upload a file directly from the client.
 * @param {string} key - S3 object key/path
 * @param {string} contentType - MIME type of the file
 * @param {number} expiresIn - URL lifetime in seconds (default: 5 minutes)
 * @returns {Promise<string>} Upload URL
 */
const getUploadUrl = async (key, contentType, expiresIn = 300) => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType
  });
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * A browser upload form straight to S3 (presigned POST), so large files never pass through
 * this server. S3 itself refuses a file over `maxBytes`, another key, or another Content-Type.
 * @returns {Promise<{ url: string, fields: Record<string, string> }>}
 */
const createUploadPost = async (key, contentType, maxBytes, expiresIn = 900) => createPresignedPost(s3Client, {
  Bucket: bucketName,
  Key: key,
  Conditions: [['content-length-range', 1, maxBytes], ['eq', '$Content-Type', contentType]],
  Fields: { 'Content-Type': contentType },
  Expires: expiresIn
});

/** Size and type of a stored object (throws when it doesn't exist). */
const headObject = async (key) => s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));

/** The first `bytes` bytes of a stored object, as a Buffer (for the file-signature check). */
const readObjectStart = async (key, bytes = 64) => {
  const result = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: key, Range: `bytes=0-${bytes - 1}` }));
  return Buffer.from(await result.Body.transformToByteArray());
};

/**
 * Deletes an object from S3.
 * @param {string} key - S3 object key/path
 * @returns {Promise<any>} Response from S3
 */
const deleteObject = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  });
  return s3Client.send(command);
};

/**
 * Constructs the standard public URL of a resource.
 * @param {string} key - S3 object key/path
 * @returns {string} Public URL
 */
const getPublicUrl = (key) => {
  // No made-up local path when storage isn't configured: the caller fails and the cause is logged.
  if (!bucketName || !region) {
    throw new Error('[storage] S3_BUCKET_NAME / AWS_REGION are not configured, so uploaded files have no URL.');
  }
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
};

const uploadBuffer = async (key, buffer, contentType) => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });
  return s3Client.send(command);
};

module.exports = {
  s3Client,
  getUploadUrl,
  createUploadPost,
  headObject,
  readObjectStart,
  deleteObject,
  getPublicUrl,
  uploadBuffer
};
