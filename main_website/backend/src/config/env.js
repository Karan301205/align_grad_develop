const dotenv = require('dotenv');
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// Fail-fast in production mode: critical variables must be explicitly defined and not use fallbacks
if (isProd) {
  const critical = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
  const missing = critical.filter(key => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    throw new Error(`[CRITICAL CONFIG ERROR] Environment variable(s) required in production mode are missing: ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET === 'align_grade_super_secret_jwt_key_2026') {
    throw new Error('[CRITICAL CONFIG ERROR] Default insecure JWT_SECRET must not be used in production mode.');
  }
}

// Normalize CLIENT_URL trailing slashes to prevent malformed reset-password URLs
const rawClientUrl = process.env.CLIENT_URL || (isProd ? '' : 'http://localhost:5173');
const normalizedClientUrl = rawClientUrl ? rawClientUrl.replace(/\/+$/, '') : '';

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || (isProd ? '' : 'align_grade_super_secret_jwt_key_2026'),
  CLIENT_URL: normalizedClientUrl,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || (isProd ? '' : 'aligngrade-storage-2026'),
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE !== 'false',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'AlignGrad Team',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || ''
};

module.exports = env;

