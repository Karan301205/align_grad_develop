const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const s3Config = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

const bucketName = process.env.S3_BUCKET_NAME;
const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
const cloudfrontKeyId = process.env.CLOUDFRONT_KEY_ID;
const configuredPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH || '../cloudfront_private_key.pem';
let privateKeyPath = path.resolve(__dirname, '..', configuredPath);
if (!fs.existsSync(privateKeyPath)) {
  const rootPath = path.resolve(__dirname, '../../..', 'cloudfront_private_key.pem');
  if (fs.existsSync(rootPath)) {
    privateKeyPath = rootPath;
  }
}

console.log('--- Configuration Loaded ---');
console.log('AWS Region:', s3Config.region);
console.log('S3 Bucket:', bucketName);
console.log('Access Key ID:', s3Config.credentials.accessKeyId ? s3Config.credentials.accessKeyId.slice(0, 5) + '...' : 'MISSING');
console.log('CloudFront Domain:', cloudfrontDomain);
console.log('CloudFront Key ID:', cloudfrontKeyId);
console.log('Private Key Path:', privateKeyPath, 'Exists:', fs.existsSync(privateKeyPath));

const s3 = new S3Client(s3Config);

function toBase64Url(str) {
  return str.replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');
}

function signCloudFrontUrl(url, keyPairId, privateKey, expiresEpoch) {
  // Canned policy
  const cannedPolicy = JSON.stringify({
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': expiresEpoch
          }
        }
      }
    ]
  });

  const sign = crypto.createSign('RSA-SHA1');
  sign.update(cannedPolicy);
  const signature = toBase64Url(sign.sign(privateKey, 'base64'));

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}Expires=${expiresEpoch}&Signature=${signature}&Key-Pair-Id=${keyPairId}`;
}

async function runTests() {
  const testKey = `test-verify/test-${Date.now()}.txt`;
  const testContent = `Hello from AlignGrade CloudFront & S3 verification test at ${new Date().toISOString()}`;

  console.log('\n--- Step 1: Testing S3 Direct Access ---');
  try {
    // 1. Upload test file to S3
    console.log(`Uploading test object to S3: s3://${bucketName}/${testKey}`);
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    }));
    console.log('✅ S3 Upload successful!');

    // 2. List or Get object from S3
    console.log('Fetching object back from S3...');
    const getRes = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey
    }));
    const bodyString = await getRes.Body.transformToString();
    console.log('✅ S3 GetObject successful! Content matches:', bodyString === testContent);

  } catch (err) {
    console.error('❌ S3 Test Failed:', err.message);
  }

  console.log('\n--- Step 2: Testing CloudFront Key & Signed URL ---');
  if (!fs.existsSync(privateKeyPath)) {
    console.error(`❌ Private key file not found at ${privateKeyPath}`);
    return;
  }

  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const targetResourceUrl = `https://${cloudfrontDomain}/${testKey}`;
  const expires = Math.floor((Date.now() + 60 * 60 * 1000) / 1000); // 1 hour

  try {
    const signedUrl = signCloudFrontUrl(targetResourceUrl, cloudfrontKeyId, privateKey, expires);
    console.log('Generated Signed CloudFront URL:');
    console.log(signedUrl);

    console.log('\nFetching resource via CloudFront Signed URL...');
    const response = await fetch(signedUrl);
    console.log(`HTTP Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    if (response.ok) {
      console.log('✅ CloudFront fetched object successfully!');
      console.log('Response Content:', responseText);
    } else {
      console.log('⚠️ CloudFront Response Error body:', responseText);
    }

    // Also test fetching without signature to verify CloudFront enforces restriction
    console.log('\nTesting unsigned request to verify security enforcement...');
    const unsignedRes = await fetch(targetResourceUrl);
    console.log(`Unsigned HTTP Status: ${unsignedRes.status} (Expected 403 Forbidden if private)`);

  } catch (err) {
    console.error('❌ CloudFront Signing or Fetch Failed:', err.message);
  }

  console.log('\n--- Step 3: Cleanup ---');
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey
    }));
    console.log('✅ Cleaned up test object from S3.');
  } catch (err) {
    console.error('⚠️ Cleanup failed:', err.message);
  }
}

runTests();
