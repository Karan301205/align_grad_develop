const { S3Client } = require('@aws-sdk/client-s3');

// S3 configuration helpers for the Admin Portal. Centralizes reading the AWS
// credentials/bucket from the environment and constructing the S3 client so the
// storage and dashboard controllers no longer duplicate this wiring.

function getS3Settings() {
  return {
    bucketName: process.env.S3_BUCKET_NAME || 'aligngrade-storage-2026',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1'
  };
}

// Builds an S3Client from the given (or env-derived) credentials.
function createS3Client({ region, accessKeyId, secretAccessKey } = getS3Settings()) {
  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey }
  });
}

module.exports = { getS3Settings, createS3Client };
