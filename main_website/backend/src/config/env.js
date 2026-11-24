const dotenv = require('dotenv');
const { ensureDatabaseUrl } = require('./databaseUrl');
dotenv.config();
ensureDatabaseUrl(); // DATABASE_URL from DB_HOST/DB_NAME/DB_USER/DB_PASSWORD/DB_PORT/DB_SCHEMA

const isProd = process.env.NODE_ENV === 'production';

// Fail-fast in production mode: critical variables must be explicitly defined and not use fallbacks
if (isProd) {
  const critical = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
  const missing = critical.filter(key => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    const named = missing.map(key => (key === 'DATABASE_URL' ? 'DB_HOST/DB_NAME/DB_USER/DB_PASSWORD (or DATABASE_URL)' : key));
    throw new Error(`[CRITICAL CONFIG ERROR] Environment variable(s) required in production mode are missing: ${named.join(', ')}`);
  }
  if (process.env.JWT_SECRET === 'align_grade_super_secret_jwt_key_2026') {
    throw new Error('[CRITICAL CONFIG ERROR] Default insecure JWT_SECRET must not be used in production mode.');
  }
}

// Every environment except automated tests needs a real signing secret (there is no
// built-in default).
if (process.env.NODE_ENV !== 'test' && !(process.env.JWT_SECRET || '').trim()) {
  throw new Error('[CRITICAL CONFIG ERROR] JWT_SECRET is not set in main_website/backend/.env.');
}

// Normalize CLIENT_URL trailing slashes to prevent malformed reset-password URLs
// No hardcoded fallback: the frontend address must come from CLIENT_URL.
const rawClientUrl = process.env.CLIENT_URL || '';
if (!rawClientUrl) {
  console.warn('[config] CLIENT_URL is not set — password-reset links will be broken. Set it in main_website/backend/.env.');
}
const normalizedClientUrl = rawClientUrl ? rawClientUrl.replace(/\/+$/, '') : '';

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  CLIENT_URL: normalizedClientUrl,
  // Optional sign-in pages per role, for links in support emails when candidates and recruiters
  // use different hosts (VITE_CANDIDATE_URL / VITE_RECRUITER_URL). Empty → CLIENT_URL.
  CANDIDATE_PORTAL_URL: (process.env.CANDIDATE_PORTAL_URL || '').trim(),
  RECRUITER_PORTAL_URL: (process.env.RECRUITER_PORTAL_URL || '').trim(),
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE !== 'false',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'AlignGrad Team',
  VERIFICATION_PIN_EXPIRY_MINUTES: parseInt(process.env.VERIFICATION_PIN_EXPIRY_MINUTES || '10', 10),
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  // Optional Redis (e.g. redis://:password@host:6379): email queue, shared rate limits and
  // login lockouts, and the run-once lock for the hourly job clean-up. Empty → all of that stays
  // inside this one process (emails are sent directly). There is no built-in address.
  REDIS_URL: (process.env.REDIS_URL || '').trim(),
  // Google sign-in: the OAuth client ID that tokens must be issued for (same value as VITE_GOOGLE_CLIENT_ID).
  // No built-in value: without it Google sign-in is refused with a clear message.
  GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  // Job lifecycle (modules/jobs/jobLifecycle.service.js): the longest listing a recruiter may choose,
  // how long after closing a job is slimmed, and how long after that it is deleted.
  JOB_MAX_ACTIVE_DAYS: parseInt(process.env.JOB_MAX_ACTIVE_DAYS, 10) || 90,
  JOB_ARCHIVE_AFTER_DAYS: parseInt(process.env.JOB_ARCHIVE_AFTER_DAYS, 10) || 30,
  JOB_DELETE_AFTER_DAYS: parseInt(process.env.JOB_DELETE_AFTER_DAYS, 10) || 365,
  // Most open jobs a candidate's job list returns (newest first). Keeps that request bounded.
  JOB_LIST_LIMIT: parseInt(process.env.JOB_LIST_LIMIT, 10) || 500,
  // Frontend origins allowed to call this API from a browser, comma separated
  // (e.g. https://aligngrad.com,https://candidate.aligngrad.com). The origins of CLIENT_URL and the
  // portal URLs are always added. Empty → every origin is allowed (with a startup warning).
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  // Email sending tuning.
  // Emails sent at the same time: the queue's worker count and the SMTP pool's open connections.
  EMAIL_QUEUE_CONCURRENCY: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY, 10) || 5,
  EMAIL_QUEUE_ATTEMPTS: parseInt(process.env.EMAIL_QUEUE_ATTEMPTS, 10) || 3 // tries per email before giving up
};

module.exports = env;

