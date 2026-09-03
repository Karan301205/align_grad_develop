const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const bucketName = process.env.S3_BUCKET_NAME;
const region = process.env.AWS_REGION || 'ap-south-1';

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
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
  deleteObject,
  getPublicUrl,
  uploadBuffer
};
