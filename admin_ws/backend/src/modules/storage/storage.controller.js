const { getDB } = require('../../config/database');
const { computeS3Storage } = require('./services/s3Storage.service');
const { computeDatabaseStorage } = require('./services/databaseStorage.service');

// Orchestrates the storage explorer response by combining the S3 and PostgreSQL
// storage reports. Listing, categorization and cost estimates live in dedicated
// services; this controller wires them together and shapes the HTTP response.
exports.getStorageDetails = async (req, res, next) => {
  try {
    const s3 = await computeS3Storage();

    const db = getDB();
    const dbStats = await computeDatabaseStorage(db);

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
      s3Unavailable: s3.unavailable,
      databaseStats: dbStats
    });

  } catch (err) {
    next(err);
  }
};
