const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

// S3 configuration helpers for the Admin Portal. Centralizes reading the AWS
// credentials/bucket from the environment and constructing the S3 client so the
// storage and dashboard controllers no longer duplicate this wiring.

function getS3Settings() {
  return {
    bucketName: env.S3_BUCKET_NAME,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION
  };
}

// Builds an S3Client from the given (or env-derived) credentials.
function createS3Client({ region, accessKeyId, secretAccessKey } = getS3Settings()) {
  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey }
  });
}

// Resolves the public URL for an S3 object key using env.AWS_S3_BASE_URL or bucket settings
function getS3FileUrl(key, bucket = env.S3_BUCKET_NAME, region = env.AWS_REGION) {
  if (!key) return '';
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  if (env.AWS_S3_BASE_URL) {
    const base = env.AWS_S3_BASE_URL.replace(/\/+$/, '');
    return `${base}/${cleanKey}`;
  }
  if (!bucket) return `/${cleanKey}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${cleanKey}`;
}

module.exports = { getS3Settings, createS3Client, getS3FileUrl };
