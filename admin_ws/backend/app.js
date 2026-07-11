const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');
const { rateLimiter } = require('./src/middleware/rateLimiter');
const rateLimitConfig = require('./src/config/rateLimit.config');

const app = express();

app.use(cors());
app.use(express.json());

// Apply global rate limiting across all administrative API endpoints
app.use(rateLimiter(rateLimitConfig.relaxed));

// Routes placeholder
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Admin API Server is healthy' });
});

app.use('/api/dashboard', require('./src/routes/dashboard.routes'));
app.use('/api/student', require('./src/routes/student.routes'));
app.use('/api/recruiter', require('./src/routes/recruiter.routes'));
app.use('/api/job', require('./src/routes/job.routes'));
app.use('/api/storage', require('./src/routes/storage.routes'));
app.use('/api/analytics', require('./src/routes/analytics.routes'));

// Error handling
app.use(errorHandler);

module.exports = app;
