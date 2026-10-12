const express = require('express');
const cors = require('cors');
const env = require('./src/config/env');
const errorHandler = require('./src/middleware/errorHandler');
const { rateLimiter } = require('./src/middleware/rateLimiter');
const rateLimitConfig = require('./src/config/rateLimit.config');

const authMiddleware = require('./src/middleware/auth');

const app = express();

// Configure CORS origin to establish secure connection with admin frontend via env
const allowedOrigins = [
  env.ADMIN_FRONTEND_URL
].filter(Boolean).map(origin => origin.replace(/\/+$/, ''));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server) where origin is undefined
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.length === 0 || allowedOrigins.includes(normalizedOrigin) || env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin '${origin}' not allowed by Admin Portal security policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Apply global rate limiting across all administrative API endpoints
app.use(rateLimiter(rateLimitConfig.relaxed));

// Routes placeholder
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Admin API Server is healthy' });
});

// Auth Routes (unprotected)
app.use('/api/auth', require('./src/modules/auth').routes);

// Administrative Routes (protected by JWT authMiddleware)
app.use('/api/dashboard', authMiddleware, require('./src/modules/dashboard').routes);
app.use('/api/student', authMiddleware, require('./src/modules/students').routes);
app.use('/api/recruiter', authMiddleware, require('./src/modules/recruiters').routes);
app.use('/api/job', authMiddleware, require('./src/modules/jobs').routes);
app.use('/api/storage', authMiddleware, require('./src/modules/storage').routes);
app.use('/api/analytics', authMiddleware, require('./src/modules/analytics').routes);
app.use('/api/courses', authMiddleware, require('./src/modules/courses').routes);

// Error handling
app.use(errorHandler);

module.exports = app;
