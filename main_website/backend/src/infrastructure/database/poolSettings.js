// Connection-pool settings for the running server's Prisma client. Only the server uses
// these: the Prisma CLI and `npm run db:migrate` keep connecting straight to DB_PORT.
//
//   DB_CONNECTION_LIMIT  connections this process may open (default 10). Keep
//                        (server processes × this) + admin_ws's DB_POOL_MAX below
//                        Postgres max_connections.
//   DB_POOL_TIMEOUT      seconds a query waits for a free connection before failing (default 10)
//   DB_POOLER_PORT       when set, connect through PgBouncer (transaction mode) on this port of
//                        the same host, and tell Prisma so (pgbouncer=true)
//
// Settings already present in the URL are kept.

const DEFAULT_CONNECTION_LIMIT = 10;
const DEFAULT_POOL_TIMEOUT_SECONDS = 10;

const positiveInt = (value, fallback) => {
  const number = parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

function withPoolSettings(databaseUrl, source = process.env) {
  if (!databaseUrl) return databaseUrl;
  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    return databaseUrl; // not a URL we can read; Prisma reports the problem itself
  }
  const setDefault = (name, value) => {
    if (!url.searchParams.has(name)) url.searchParams.set(name, String(value));
  };
  setDefault('connection_limit', positiveInt(source.DB_CONNECTION_LIMIT, DEFAULT_CONNECTION_LIMIT));
  setDefault('pool_timeout', positiveInt(source.DB_POOL_TIMEOUT, DEFAULT_POOL_TIMEOUT_SECONDS));
  const poolerPort = positiveInt(source.DB_POOLER_PORT, 0);
  if (poolerPort) {
    url.port = String(poolerPort);
    url.searchParams.set('pgbouncer', 'true');
  }
  return url.toString();
}

module.exports = { withPoolSettings };
