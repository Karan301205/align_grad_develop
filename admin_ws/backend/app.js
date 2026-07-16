const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');
const { rateLimiter } = require('./src/middleware/rateLimiter');
const rateLimitConfig = require('./src/config/rateLimit.config');

const authMiddleware = require('./src/middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Apply global rate limiting across all administrative API endpoints
app.use(rateLimiter(rateLimitConfig.relaxed));

// Routes placeholder
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Admin API Server is healthy' });
});

// Auth Routes (unprotected)
app.use('/api/auth', require('./src/routes/auth.routes'));

// Administrative Routes (protected by JWT authMiddleware)
app.use('/api/dashboard', authMiddleware, require('./src/routes/dashboard.routes'));
app.use('/api/student', authMiddleware, require('./src/routes/student.routes'));
app.use('/api/recruiter', authMiddleware, require('./src/routes/recruiter.routes'));
app.use('/api/job', authMiddleware, require('./src/routes/job.routes'));
app.use('/api/storage', authMiddleware, require('./src/routes/storage.routes'));
app.use('/api/analytics', authMiddleware, require('./src/routes/analytics.routes'));

// Error handling
app.use(errorHandler);

module.exports = app;
