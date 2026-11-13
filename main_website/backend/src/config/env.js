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
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || ''
};

module.exports = env;

