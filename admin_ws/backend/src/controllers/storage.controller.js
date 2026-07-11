const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getDB } = require('../config/database');

// Helper to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

exports.getStorageDetails = async (req, res, next) => {
  try {
    const bucketName = process.env.S3_BUCKET_NAME || 'aligngrade-storage-2026';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'ap-south-1';

    let files = [];
    let isMock = false;

    if (!accessKeyId || !secretAccessKey) {
      isMock = true;
    } else {
      try {
        const s3 = new S3Client({
          region,
          credentials: { accessKeyId, secretAccessKey }
        });
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
      files = [
        { key: 'resumes/student_1/resume_17835824.pdf', size: 1048576 * 1.2, lastModified: new Date(Date.now() - 3600000 * 24 * 3) },
        { key: 'resumes/student_2/resume_17835948.pdf', size: 1048576 * 0.85, lastModified: new Date(Date.now() - 3600000 * 24 * 5) },
        { key: 'videos/student_1/intro_17835849.mp4', size: 1024 * 1024 * 12.4, lastModified: new Date(Date.now() - 3600000 * 24 * 3) },
        { key: 'videos/student_3/intro_17836102.mp4', size: 1024 * 1024 * 9.8, lastModified: new Date(Date.now() - 3600000 * 24 * 1) },
        { key: 'docs/rec_1/google_verify.pdf', size: 1024 * 1024 * 2.3, lastModified: new Date(Date.now() - 3600000 * 24 * 10) },
        { key: 'docs/rec_2/ms_verify.pdf', size: 1024 * 1024 * 3.1, lastModified: new Date(Date.now() - 3600000 * 24 * 8) },
        { key: 'images/student_1/pic_17835812.jpg', size: 1024 * 84, lastModified: new Date(Date.now() - 3600000 * 24 * 3) },
        { key: 'images/student_2/pic_17835922.jpg', size: 1024 * 72, lastModified: new Date(Date.now() - 3600000 * 24 * 5) }
      ];
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

    // --- Query MongoDB database stats ---
    let db;
    let mongoStats = null;

    try {
      db = getDB();
    } catch (e) {
      console.warn('[DB WARNING] Database connection not initialized.');
    }

    if (db) {
      try {
        const stats = await db.command({ dbStats: 1 });
        const collectionsList = await db.listCollections().toArray();
        const collectionDetails = [];

        const atlasPricePerGB = 0.10; // Atlas Serverless standard storage cost per GB-month

        for (const col of collectionsList) {
          const cStats = await db.command({ collStats: col.name });
          const storageGB = (cStats.storageSize || 0) / (1024 * 1024 * 1024);
          const monthlyCost = storageGB * atlasPricePerGB;

          collectionDetails.push({
            name: col.name,
            count: cStats.count,
            size: cStats.size || 0,
            formattedSize: formatBytes(cStats.size || 0),
            storageSize: cStats.storageSize || 0,
            formattedStorageSize: formatBytes(cStats.storageSize || 0),
            indexSize: cStats.totalIndexSize || 0,
            formattedIndexSize: formatBytes(cStats.totalIndexSize || 0),
            cost: monthlyCost
          });
        }

        const totalDbStorageGB = (stats.storageSize || 0) / (1024 * 1024 * 1024);
        const totalDbCost = totalDbStorageGB * atlasPricePerGB;

        mongoStats = {
          dbName: db.databaseName || 'aligngrade',
          totalDocuments: stats.objects || 0,
          dataSize: stats.dataSize || 0,
          formattedDataSize: formatBytes(stats.dataSize || 0),
          storageSize: stats.storageSize || 0,
          formattedStorageSize: formatBytes(stats.storageSize || 0),
          indexSize: stats.indexSize || 0,
          formattedIndexSize: formatBytes(stats.indexSize || 0),
          estimatedMonthlyBill: totalDbCost,
          collections: collectionDetails,
          isMock: false
        };
      } catch (err) {
        console.warn('[MONGO WARNING] Failed getting MongoDB stats:', err.message);
      }
    }

    if (!mongoStats) {
      // Fallback Mock data for MongoDB stats
      const mockCollections = [
        { name: 'User', count: 12, size: 4320, storageSize: 16384, indexSize: 16384 },
        { name: 'Profile', count: 8, size: 13107, storageSize: 36864, indexSize: 20480 },
        { name: 'Company', count: 4, size: 2150, storageSize: 16384, indexSize: 16384 },
        { name: 'Job', count: 8, size: 18940, storageSize: 36864, indexSize: 20480 },
        { name: 'Application', count: 14, size: 4712, storageSize: 16384, indexSize: 16384 },
        { name: 'TestAttempt', count: 25, size: 8396, storageSize: 16384, indexSize: 16384 }
      ];

      const atlasPricePerGB = 0.10;
      let totalStorageSize = 0;
      let totalDataSize = 0;
      let totalIndexes = 0;
      let totalCount = 0;

      const formattedMockCols = mockCollections.map(col => {
        const storageGB = col.storageSize / (1024 * 1024 * 1024);
        const cost = storageGB * atlasPricePerGB;

        totalStorageSize += col.storageSize;
        totalDataSize += col.size;
        totalIndexes += col.indexSize;
        totalCount += col.count;

        return {
          name: col.name,
          count: col.count,
          size: col.size,
          formattedSize: formatBytes(col.size),
          storageSize: col.storageSize,
          formattedStorageSize: formatBytes(col.storageSize),
          indexSize: col.indexSize,
          formattedIndexSize: formatBytes(col.indexSize),
          cost
        };
      });

      const totalStorageGB = totalStorageSize / (1024 * 1024 * 1024);

      mongoStats = {
        dbName: 'aligngrade_sandbox',
        totalDocuments: totalCount,
        dataSize: totalDataSize,
        formattedDataSize: formatBytes(totalDataSize),
        storageSize: totalStorageSize,
        formattedStorageSize: formatBytes(totalStorageSize),
        indexSize: totalIndexes,
        formattedIndexSize: formatBytes(totalIndexes),
        estimatedMonthlyBill: totalStorageGB * atlasPricePerGB,
        collections: formattedMockCols,
        isMock: true
      };
    }

    res.json({
      success: true,
      bucketName,
      region,
      totalBytes,
      formattedTotalBytes: formatBytes(totalBytes),
      totalFiles: formattedFiles.length,
      estimatedMonthlyBill: totalCost,
      categories,
      files: formattedFiles,
      isMock,
      mongoStats
    });

  } catch (err) {
    next(err);
  }
};
