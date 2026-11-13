// Builds the PostgreSQL connection URL from separate DB_* variables.
//
//   DB_HOST, DB_NAME, DB_USER, DB_PASSWORD   required
//   DB_PORT                                  optional, default 5432
//   DB_SCHEMA                                optional, Postgres schema (sent as ?schema=)
//
// src/config/database.js reads DATABASE_URL (and its ?schema= param), so
// ensureDatabaseUrl() fills it in from the parts at startup. An explicitly set
// DATABASE_URL always wins. Kept in sync by hand with main_website's copy —
// admin_ws must not import from main_website.
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

function ensureDatabaseUrl(target = process.env) {
  if (target.DATABASE_URL !== undefined) return target.DATABASE_URL;
  const built = buildDatabaseUrl(target);
  if (built) target.DATABASE_URL = built;
  return target.DATABASE_URL || '';
}

module.exports = { REQUIRED_PARTS, buildDatabaseUrl, ensureDatabaseUrl };
