const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5002,
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/alignGrad',
  JWT_SECRET: process.env.JWT_SECRET || 'admin_portal_secret_jwt_key_2026',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'aligngrade-storage-2026',
};

// Fail-fast in production mode if required variables are missing or use default fallbacks
if (env.NODE_ENV === 'production') {
  const critical = ['DATABASE_URL', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  
  if (!process.env.JWT_SECRET) {
    critical.push('JWT_SECRET');
  }

  for (const key of critical) {
    if (!process.env[key] && !env[key]) {
      throw new Error(`CRITICAL CONFIG ERROR: Environment variable ${key} is required in production mode but is not defined.`);
    }
  }
}

module.exports = env;
