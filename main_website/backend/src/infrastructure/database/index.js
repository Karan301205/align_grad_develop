// Database client for the main backend: PostgreSQL through Prisma, with no fallback.
//
// If the database is unreachable or out of connections, queries fail: the cause is
// logged on the server and the API answers with an error. Nothing switches to
// made-up data (the old in-memory fallback hid outages, so the portal kept showing
// sample rows and silently lost every write).
//
// The in-memory store in ./mock is for automated tests only. It is used when a test
// asks for it explicitly: NODE_ENV=test and an empty DATABASE_URL.
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const { ensureDatabaseUrl } = require('../../config/databaseUrl');
const { withPoolSettings } = require('./poolSettings');

dotenv.config();
ensureDatabaseUrl(); // build DATABASE_URL from the DB_* parts before PrismaClient reads it

const useTestStore = process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL;

if (!useTestStore && !process.env.DATABASE_URL) {
  throw new Error('[database] DATABASE_URL is not configured. Set DB_HOST, DB_NAME, DB_USER and DB_PASSWORD (DB_PORT, DB_SCHEMA optional) in main_website/backend/.env.');
}

// Pool size, wait time and the optional PgBouncer port come from env (./poolSettings.js).
const client = useTestStore
  ? require('./mock/mockClient').mockClient
  : new PrismaClient({ datasources: { db: { url: withPoolSettings(process.env.DATABASE_URL) } } });

/**
 * Startup check. Logs whether PostgreSQL answers; a failure is reported, not hidden,
 * and the server keeps running so it recovers once the database is reachable again.
 */
async function initDb() {
  if (useTestStore) return false;
  try {
    const users = await client.user.count();
    console.log(`[database] Connected to PostgreSQL (${users} users).`);
    return true;
  } catch (err) {
    console.error('[database] PostgreSQL is not answering. Every request that needs it will fail until it is reachable again. Cause:', err.message);
    return false;
  }
}

module.exports = {
  prisma: client,
  // True only inside automated tests (the in-memory store).
  isMock: () => useTestStore,
  initDb
};
