const { formatBytes } = require('../../../utils/formatBytes');

// Storage cost estimate per GB-month. Kept at the rate the admin UI quotes next
// to the estimate ($0.10/GB).
const PRICE_PER_GB_MONTH = 0.10;
const BYTES_PER_GB = 1024 * 1024 * 1024;

// Prisma's migration bookkeeping table is not application data.
const EXCLUDED_TABLES = ['_prisma_migrations'];

function quoteIdentifier(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

// Computes the PostgreSQL portion of the storage explorer report (per-table
// stats for the active schema + estimated storage cost). A failed query is thrown
// to the caller; there is no stand-in data. Per table:
//   size        = pg_table_size          (heap + TOAST)
//   indexSize   = pg_indexes_size
//   storageSize = pg_total_relation_size (heap + TOAST + indexes; drives the cost)
async function computeDatabaseStorage(db) {
  const { rows: [info] } = await db.query(
    'SELECT current_database() AS "database", current_schema() AS "schema"'
  );

  // pg_* size functions return bigint, which node-pg hands back as strings.
  const { rows: tables } = await db.query(
    `SELECT c.relname AS "name",
            pg_table_size(c.oid) AS "size",
            pg_indexes_size(c.oid) AS "indexSize",
            pg_total_relation_size(c.oid) AS "storageSize"
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = current_schema()
        AND c.relkind = 'r'
        AND NOT (c.relname = ANY($1::text[]))
      ORDER BY c.relname`,
    [EXCLUDED_TABLES]
  );

  // Exact row counts in one round trip. Table names come from pg_class
  // (never from user input) and are quoted as identifiers.
  let counts = [];
  if (tables.length > 0) {
    const countSql = tables
      .map((t, i) => `SELECT ${i} AS "i", count(*) AS "count" FROM ${quoteIdentifier(t.name)}`)
      .join(' UNION ALL ');
    const { rows } = await db.query(countSql);
    counts = rows;
  }
  const countByIndex = new Map(counts.map(r => [Number(r.i), Number(r.count)]));

  let totalDocuments = 0;
  let totalDataSize = 0;
  let totalStorageSize = 0;
  let totalIndexSize = 0;

  const collectionDetails = tables.map((t, i) => {
    const count = countByIndex.get(i) || 0;
    const size = Number(t.size) || 0;
    const storageSize = Number(t.storageSize) || 0;
    const indexSize = Number(t.indexSize) || 0;

    totalDocuments += count;
    totalDataSize += size;
    totalStorageSize += storageSize;
    totalIndexSize += indexSize;

    return {
      name: t.name,
      count,
      size,
      formattedSize: formatBytes(size),
      storageSize,
      formattedStorageSize: formatBytes(storageSize),
      indexSize,
      formattedIndexSize: formatBytes(indexSize),
      cost: (storageSize / BYTES_PER_GB) * PRICE_PER_GB_MONTH
    };
  });

  return {
    dbName: info.schema ? `${info.database} (${info.schema})` : info.database,
    totalDocuments,
    dataSize: totalDataSize,
    formattedDataSize: formatBytes(totalDataSize),
    storageSize: totalStorageSize,
    formattedStorageSize: formatBytes(totalStorageSize),
    indexSize: totalIndexSize,
    formattedIndexSize: formatBytes(totalIndexSize),
    estimatedMonthlyBill: (totalStorageSize / BYTES_PER_GB) * PRICE_PER_GB_MONTH,
    collections: collectionDetails
  };
}

module.exports = { computeDatabaseStorage };
