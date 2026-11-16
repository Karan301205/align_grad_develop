// Picks the PostgreSQL connection URL.
//
// Two databases are configured side by side in .env, and DB_TARGET picks one:
//   DB_TARGET=local    LOCAL_DATABASE_URL  (the Postgres on this machine)
//   DB_TARGET=server   (or unset) the shared server, built from the DB_* parts:
//     DB_HOST, DB_NAME, DB_USER, DB_PASSWORD   required
//     DB_PORT                                  optional, default 5432
//     DB_SCHEMA                                optional, Postgres schema (sent as ?schema=)
// The DB_* server keys stay in .env even while DB_TARGET=local:
// `npm run db:migrate` (main backend) applies migrations to both databases.
//
// Prisma (schema.prisma `url = env("DATABASE_URL")`) and the rest of the code read
// DATABASE_URL, so ensureDatabaseUrl() fills it in at startup.
// An explicitly set DATABASE_URL always wins — including an empty one, which is how
// tests force the in-memory mock database.
// User, password and database name are URL-encoded, so passwords containing
// characters like & @ $ # / ? work as-is in .env.

const REQUIRED_PARTS = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function buildDatabaseUrl(source = process.env) {
  if (!REQUIRED_PARTS.every((key) => hasValue(source[key]))) return '';
  const host = String(source.DB_HOST).trim();
  const port = hasValue(source.DB_PORT) ? String(source.DB_PORT).trim() : '5432';
  const user = encodeURIComponent(String(source.DB_USER).trim());
  const password = encodeURIComponent(String(source.DB_PASSWORD));
  const database = encodeURIComponent(String(source.DB_NAME).trim());
  const url = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  return hasValue(source.DB_SCHEMA) ? `${url}?schema=${encodeURIComponent(String(source.DB_SCHEMA).trim())}` : url;
}

function databaseTarget(source = process.env) {
  return String(source.DB_TARGET || 'server').trim().toLowerCase() === 'local' ? 'local' : 'server';
}

function buildLocalDatabaseUrl(source = process.env) {
  return hasValue(source.LOCAL_DATABASE_URL) ? String(source.LOCAL_DATABASE_URL).trim() : '';
}

function ensureDatabaseUrl(target = process.env) {
  if (target.DATABASE_URL !== undefined) return target.DATABASE_URL;
  let built;
  if (databaseTarget(target) === 'local') {
    built = buildLocalDatabaseUrl(target);
    if (!built) console.warn('[config] DB_TARGET=local but LOCAL_DATABASE_URL is empty; not falling back to the server database.');
  } else {
    built = buildDatabaseUrl(target);
  }
  if (built) target.DATABASE_URL = built;
  return target.DATABASE_URL || '';
}

module.exports = { REQUIRED_PARTS, buildDatabaseUrl, buildLocalDatabaseUrl, databaseTarget, ensureDatabaseUrl };
