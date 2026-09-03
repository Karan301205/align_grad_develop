const { getDbSafe } = require('../../config/database');
const { computeS3Storage } = require('./services/s3Storage.service');
const { computeMongoStorage } = require('./services/mongoStorage.service');

// Orchestrates the storage explorer response by combining the S3 and MongoDB
// storage reports. The heavy lifting (listing, categorization, cost estimates,
// mock fallbacks) now lives in dedicated services, leaving this controller
// responsible only for wiring them together and shaping the HTTP response.
exports.getStorageDetails = async (req, res, next) => {
  try {
    const s3 = await computeS3Storage();

    let db = getDbSafe();
    if (!db) {
      console.warn('[DB WARNING] Database connection not initialized.');
    }

    const mongoStats = await computeMongoStorage(db);

    res.json({
      success: true,
      bucketName: s3.bucketName,
      region: s3.region,
      totalBytes: s3.totalBytes,
      formattedTotalBytes: s3.formattedTotalBytes,
      totalFiles: s3.totalFiles,
      estimatedMonthlyBill: s3.estimatedMonthlyBill,
      categories: s3.categories,
      files: s3.files,
      isMock: s3.isMock,
      mongoStats
    });

  } catch (err) {
    next(err);
  }
};
