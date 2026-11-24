const { Pool } = require('pg');
const env = require('./env');

// PostgreSQL connection for the Admin Portal (raw `pg` driver; admin_ws stays
// decoupled from main_website's Prisma client). Tables and columns follow
// main_website/backend/prisma/schema.prisma: quoted model names ("User",
// "Company", ...) and camelCase column names ("userId", "createdAt", ...).

let pool = null;

// Quotes a schema name for the `search_path` startup option. The value is
// parsed twice by the server: first as a whitespace-separated options string
// (backslash escapes), then as an identifier list (double-quote escapes).
function quoteSearchPath(schema) {
  const identifier = `"${schema.replace(/"/g, '""')}"`;
  return identifier.replace(/\\/g, '\\\\').replace(/ /g, '\\ ');
}

// Prisma-style URLs carry `?schema=<name>`, which libpq/pg do not understand:
// strip it from the connection string and apply it as the session search_path.
function buildPoolConfig(databaseUrl) {
  const url = new URL(databaseUrl);
  const schema = url.searchParams.get('schema');
  url.searchParams.delete('schema');

  const config = {
    connectionString: url.toString(),
    max: env.DB_POOL_MAX,
    connectionTimeoutMillis: env.DB_POOL_TIMEOUT * 1000,
    idleTimeoutMillis: 30000
  };
  if (schema) {
    config.options = `-c search_path=${quoteSearchPath(schema)}`;
  }
  return { config, schema };
}

// Returns the shared pg.Pool, creating it on first use. The pool opens connections
// per query, so it works as soon as PostgreSQL is reachable; while it isn't, every
// query fails with the real cause (logged by the error handler). There is no
// offline mode and no stand-in data.
function getDB() {
  if (pool) return pool;
  if (!env.DATABASE_URL) {
    throw new Error('[database] Database is not configured: set DB_HOST, DB_NAME, DB_USER, DB_PASSWORD (DB_PORT, DB_SCHEMA optional) in admin_ws/backend/.env.');
  }
  const { config } = buildPoolConfig(env.DATABASE_URL);
  pool = new Pool(config);
  // An idle client losing its connection emits 'error' on the pool; without
  // a listener that would crash the process.
  pool.on('error', (err) => {
    console.error('[database] PostgreSQL idle client error:', err.message);
  });
  return pool;
}

// Startup check: reports whether PostgreSQL answers. A failure is logged, not hidden.
async function connectDB() {
  const db = getDB();
  const { schema } = buildPoolConfig(env.DATABASE_URL);
  try {
    await db.query('SELECT 1');
    console.log(`PostgreSQL successfully connected for Admin Portal${schema ? ` (schema: ${schema})` : ''}`);
  } catch (err) {
    console.error('[database] PostgreSQL is not answering. Every request that needs it will fail until it is reachable again. Cause:', err.message);
  }
}

module.exports = {
  connectDB,
  getDB
};
