const dotenv = require('dotenv');
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'align_grade_super_secret_jwt_key_2026',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'aligngrade-storage-2026',
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE !== 'false',
  SMTP_USER: process.env.SMTP_USER || 'aligngrad@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'AlignGrad Team',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
};

// Fail-fast in production if critical environment variables are missing
if (env.NODE_ENV === 'production') {
  const critical = ['DATABASE_URL', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  
  // JWT_SECRET must be explicitly defined and not use the default fallback in production
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
