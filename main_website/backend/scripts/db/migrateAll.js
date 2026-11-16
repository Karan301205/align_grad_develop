/**
 * Applies prisma/migrations (`prisma migrate deploy`) to BOTH configured databases,
 * so a schema change never reaches only one of them:
 *   1. local   LOCAL_DATABASE_URL
 *   2. server  built from DB_HOST/DB_NAME/DB_USER/DB_PASSWORD/DB_PORT/DB_SCHEMA
 *
 *   npm run db:migrate                  # both (stops at the first failure)
 *   npm run db:migrate -- --local-only
 *   npm run db:migrate -- --server-only
 *
 * A DATABASE_URL set in the shell overrides both and migrates only that database.
 * Workflow for a schema change: edit prisma/schema.prisma, then
 * `npm run prisma -- migrate dev --create-only` (creates the migration against the
 * default database), review it, then `npm run db:migrate`.
 */
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { buildDatabaseUrl, buildLocalDatabaseUrl } = require('../../src/config/databaseUrl');

const bin = path.resolve(__dirname, '../../node_modules/.bin/prisma');
const args = process.argv.slice(2);

// The shared server runs out of connection slots easily: migrate over one connection.
function withConnectionLimit(url) {
  const parsed = new URL(url);
  if (!parsed.searchParams.has('connection_limit')) parsed.searchParams.set('connection_limit', '1');
  return parsed.toString();
}

function migrate(label, url) {
  console.log(`\n=== prisma migrate deploy → ${label} ===`);
  const result = spawnSync(bin, ['migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
  if (result.error) {
    console.error('Could not start the Prisma CLI:', result.error.message);
    return false;
  }
  if (result.status !== 0) {
    console.error(`Migration failed on the ${label} database.`);
    return false;
  }
  return true;
}

const targets = [];
if (process.env.DATABASE_URL !== undefined) {
  targets.push(['DATABASE_URL from the shell', process.env.DATABASE_URL]);
} else {
  const local = buildLocalDatabaseUrl();
  const server = buildDatabaseUrl();
  if (!args.includes('--server-only')) {
    if (!local) console.warn('[config] LOCAL_DATABASE_URL is not set; skipping the local database.');
    else targets.push(['local', local]);
  }
  if (!args.includes('--local-only')) {
    if (!server) console.warn('[config] DB_HOST/DB_NAME/DB_USER/DB_PASSWORD are not set; skipping the server database.');
    else targets.push(['server', withConnectionLimit(server)]);
  }
}

if (targets.length === 0) {
  console.error('No database to migrate.');
  process.exit(1);
}
for (const [label, url] of targets) {
  if (!migrate(label, url)) process.exit(1);
}
console.log(`\nMigrations applied to: ${targets.map(([label]) => label).join(', ')}.`);
