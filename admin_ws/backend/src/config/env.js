const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProd = process.env.NODE_ENV === 'production';

// Fail-fast in production mode: critical variables must be explicitly defined and not use fallbacks
if (isProd) {
  const critical = ['DATABASE_URL', 'JWT_SECRET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
  const missing = critical.filter(key => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    throw new Error(`[CRITICAL ADMIN CONFIG ERROR] Environment variable(s) required in production mode are missing: ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET === 'admin_portal_secret_jwt_key_2026') {
    throw new Error('[CRITICAL ADMIN CONFIG ERROR] Default insecure JWT_SECRET must not be used in production mode.');
  }
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5002', 10),
  DATABASE_URL: process.env.DATABASE_URL || (isProd ? '' : 'mongodb://localhost:2717/alignGrad'),
  JWT_SECRET: process.env.JWT_SECRET || (isProd ? '' : 'admin_portal_secret_jwt_key_2026'),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || (isProd ? '' : 'aligngrade-storage-2026')
};

module.exports = env;

