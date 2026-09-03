const { getMockCollections } = require('../../../mocks/storage.mock');
const { formatBytes } = require('../../../utils/formatBytes');

// Computes the MongoDB portion of the storage explorer report (per-collection
// stats + estimated Atlas cost), with a mock fallback when the database is
// unavailable or the stats query fails. Logic extracted verbatim from
// storage.controller.js. Accepts the active db handle (or null).
async function computeMongoStorage(db) {
  let mongoStats = null;

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
    const mockCollections = getMockCollections();

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

  return mongoStats;
}

module.exports = { computeMongoStorage };
