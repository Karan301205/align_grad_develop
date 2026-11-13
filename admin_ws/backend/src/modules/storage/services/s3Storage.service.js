const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getS3Settings, createS3Client, getS3FileUrl } = require('../../../config/s3');
const { formatBytes } = require('../../../utils/formatBytes');

// Computes the S3 portion of the storage explorer report: lists bucket objects,
// categorizes them, and estimates monthly S3 cost. When storage isn't configured
// or listing fails, the report says so (`unavailable: true`, no files) and the
// cause is logged; it never shows stand-in files.
async function computeS3Storage() {
  const { bucketName, accessKeyId, secretAccessKey, region } = getS3Settings();

  let files = [];
  let unavailable = false;

  if (!bucketName || !accessKeyId || !secretAccessKey) {
    console.error('[storage] S3 report unavailable: S3_BUCKET_NAME / AWS credentials are not configured in admin_ws/backend/.env.');
    unavailable = true;
  } else {
    try {
      const s3 = createS3Client({ region, accessKeyId, secretAccessKey });
      const command = new ListObjectsV2Command({ Bucket: bucketName });
      const response = await s3.send(command);

      files = (response.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size || 0,
        lastModified: item.LastModified,
        eTag: item.ETag
      }));
    } catch (err) {
      console.error('[storage] S3 report unavailable: listing the bucket failed:', err);
      unavailable = true;
    }
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
      url: getS3FileUrl(file.key, bucketName, region)
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
    unavailable
  };
}

module.exports = { computeS3Storage };
