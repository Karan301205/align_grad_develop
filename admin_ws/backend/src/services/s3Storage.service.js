const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getS3Settings, createS3Client } = require('../config/s3');
const { getMockS3Files } = require('../mocks/storage.mock');
const { formatBytes } = require('../utils/formatBytes');

// Computes the S3 portion of the storage explorer report: lists bucket objects
// (or falls back to mock fixtures), categorizes them, and estimates monthly S3
// cost. Logic extracted verbatim from storage.controller.js.
async function computeS3Storage() {
  const { bucketName, accessKeyId, secretAccessKey, region } = getS3Settings();

  let files = [];
  let isMock = false;

  if (!accessKeyId || !secretAccessKey) {
    isMock = true;
  } else {
    try {
      const s3 = createS3Client({ region, accessKeyId, secretAccessKey });
      const command = new ListObjectsV2Command({ Bucket: bucketName });
      const response = await s3.send(command);

      if (response.Contents) {
        files = response.Contents.map(item => ({
          key: item.Key,
          size: item.Size || 0,
          lastModified: item.LastModified,
          eTag: item.ETag
        }));
      }
    } catch (err) {
      console.warn('[S3 WARNING] Failed listing S3 bucket objects, using fallback mockup data:', err.message);
      isMock = true;
    }
  }

  if (isMock) {
    // Mock files representing resumes, video intros, and doc verifications matching seeded users
    files = getMockS3Files();
  }

  // Initialize categories
  const categories = {
    resumes: { name: 'Resumes', count: 0, bytes: 0, cost: 0, prefix: 'resumes/' },
    videos: { name: 'Video Resumes', count: 0, bytes: 0, cost: 0, prefix: 'videos/' },
    docs: { name: 'Verification Docs', count: 0, bytes: 0, cost: 0, prefix: 'docs/' },
    images: { name: 'Profile Pictures', count: 0, bytes: 0, cost: 0, prefix: 'images/' },
    other: { name: 'Other Files', count: 0, bytes: 0, cost: 0, prefix: '' }
  };

  let totalBytes = 0;
  const s3PricePerGB = 0.023; // AWS Standard S3 monthly storage cost per GB

  const formattedFiles = files.map(file => {
    let categoryKey = 'other';
    if (file.key.startsWith('resumes/')) categoryKey = 'resumes';
    else if (file.key.startsWith('videos/')) categoryKey = 'videos';
    else if (file.key.startsWith('docs/')) categoryKey = 'docs';
    else if (file.key.startsWith('images/')) categoryKey = 'images';

    const fileGB = file.size / (1024 * 1024 * 1024);
    const fileCost = fileGB * s3PricePerGB;

    categories[categoryKey].count += 1;
    categories[categoryKey].bytes += file.size;
    categories[categoryKey].cost += fileCost;

    totalBytes += file.size;

    return {
      key: file.key,
      name: file.key.split('/').pop(),
      size: file.size,
      formattedSize: formatBytes(file.size),
      lastModified: file.lastModified,
      category: categories[categoryKey].name,
      cost: fileCost,
      url: `https://${bucketName}.s3.${region}.amazonaws.com/${file.key}`
    };
  });

  // Update category summaries with formatted bytes & costs
  Object.keys(categories).forEach(k => {
    categories[k].formattedBytes = formatBytes(categories[k].bytes);
  });

  const totalGB = totalBytes / (1024 * 1024 * 1024);
  const totalCost = totalGB * s3PricePerGB;

  return {
    bucketName,
    region,
    totalBytes,
    formattedTotalBytes: formatBytes(totalBytes),
    totalFiles: formattedFiles.length,
    estimatedMonthlyBill: totalCost,
    categories,
    files: formattedFiles,
    isMock
  };
}

module.exports = { computeS3Storage };
