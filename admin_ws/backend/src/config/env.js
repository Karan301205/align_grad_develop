const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
require('./databaseUrl').ensureDatabaseUrl(); // DATABASE_URL from DB_HOST/DB_NAME/DB_USER/DB_PASSWORD/DB_PORT/DB_SCHEMA

const isProd = process.env.NODE_ENV === 'production';

// Fail-fast in production mode: critical variables must be explicitly defined and not use fallbacks
if (isProd) {
  const critical = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ADMIN_FRONTEND_URL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET_NAME'
  ];
  const missing = critical.filter(key => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    const named = missing.map(key => (key === 'DATABASE_URL' ? 'DB_HOST/DB_NAME/DB_USER/DB_PASSWORD (or DATABASE_URL)' : key));
    throw new Error(`[CRITICAL ADMIN CONFIG ERROR] Environment variable(s) required in production mode are missing: ${named.join(', ')}`);
  }
  if (process.env.JWT_SECRET === 'admin_portal_secret_jwt_key_2026') {
    throw new Error('[CRITICAL ADMIN CONFIG ERROR] Default insecure JWT_SECRET must not be used in production mode.');
  }
}

// Needed in every environment: there is no built-in signing secret and no offline
// mode, so the server stops here with the missing setting named.
{
  const missing = [];
  if (!(process.env.JWT_SECRET || '').trim()) missing.push('JWT_SECRET');
  if (!(process.env.DATABASE_URL || '').trim()) missing.push('DB_HOST/DB_NAME/DB_USER/DB_PASSWORD (or DATABASE_URL)');
  if (missing.length > 0) {
    throw new Error(`[CRITICAL ADMIN CONFIG ERROR] Missing in admin_ws/backend/.env: ${missing.join(', ')}`);
  }
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5002', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  // Connection pool (src/config/database.js): most open connections and seconds to wait for one.
  // The admin portal connects straight to Postgres (it sets search_path per session, which
  // PgBouncer's transaction mode doesn't keep), so count DB_POOL_MAX in the connection budget.
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  DB_POOL_TIMEOUT: parseInt(process.env.DB_POOL_TIMEOUT, 10) || 10,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_FRONTEND_URL: process.env.ADMIN_FRONTEND_URL || '',
  // Optional Redis (redis://:password@host:6379): request limits shared by every admin server
  // process. Empty → each process counts in its own memory. Can be the same Redis as the main site
  // (admin keys start with "admin:").
  REDIS_URL: (process.env.REDIS_URL || '').trim(),
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
  AWS_S3_BASE_URL: process.env.AWS_S3_BASE_URL || '',
  // SMTP transport for recruiter verification decision emails
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: (process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'AlignGrad',
  // Recruiter login page linked from verification and support emails (main_website frontend)
  RECRUITER_PORTAL_URL: process.env.RECRUITER_PORTAL_URL || '',
  // Candidate sign-in page linked from support emails (main_website frontend). Optional:
  // without it, emails to candidates have no "Open Help & support" button.
  CANDIDATE_PORTAL_URL: process.env.CANDIDATE_PORTAL_URL || ''
};

module.exports = env;

