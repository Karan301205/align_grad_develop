/**
 * Runs the Prisma CLI with DATABASE_URL built from the DB_* variables in .env
 * (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT, DB_SCHEMA). Prisma's schema reads
 * env("DATABASE_URL"), which the CLI can't assemble from parts on its own.
 *
 *   npm run prisma -- migrate status
 *   npm run db:migrate                     # = prisma migrate deploy
 *
 * A DATABASE_URL set in the shell still wins (useful for one-off targets).
 */
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { ensureDatabaseUrl } = require('../../src/config/databaseUrl');

ensureDatabaseUrl();
const bin = path.resolve(__dirname, '../../node_modules/.bin/prisma');
const result = spawnSync(bin, process.argv.slice(2), { stdio: 'inherit', env: process.env });
if (result.error) {
  console.error('Could not start the Prisma CLI:', result.error.message);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
