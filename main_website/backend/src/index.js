const http = require('http');
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes/index');
const { prisma, initDb } = require('./infrastructure/database');
const uploadConfig = require('./config/upload.config');
const authMiddleware = require('./middleware/auth');

const app = express();

app.set('trust proxy', 1);
const PORT = env.PORT;

// Browser origins allowed to call the API: CORS_ORIGINS (see config/cors.js).
app.use(cors({ origin: require('./config/cors').corsOrigin() }));
// Raw-body parser for the upload proxy (resumes, documents, images). Videos don't come
// through here: they go straight to S3 (modules/uploads/directUpload.js). The cap is the
// largest limit among the proxied types (securePut enforces each type's exact limit), and
// auth runs first so unauthenticated requests are rejected before buffering.
const { VIDEO_FILE_TYPES } = require('./modules/uploads/directUpload');
const SECURE_PUT_RAW_LIMIT = Math.max(...Object.entries(uploadConfig.limits).filter(([type]) => !VIDEO_FILE_TYPES.includes(type)).map(([, bytes]) => bytes));
app.use(['/api/upload/secure-put', '/upload/secure-put'], authMiddleware, express.raw({ limit: SECURE_PUT_RAW_LIMIT, type: '*/*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Mount API routes under /api and root namespace so clients requesting
// either https://backend.aligngrad.com/api/... or https://backend.aligngrad.com/... resolve seamlessly
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.get('/health', async (req, res) => {
  try {
    // Cheapest possible database round trip. The frontend polls this, so it must not scan a table.
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', services: { api: 'ACTIVE', database: 'ACTIVE' }, timestamp: new Date() });
  } catch (error) {
    // The cause stays in the server log; callers only learn that the database is down.
    // The frontend polls this every few seconds while waiting, so log one line (the
    // cause), not the whole stack each time.
    const cause = String(error?.message || error).split('\n').map((line) => line.trim()).filter(Boolean).pop();
    console.error(`[health] Database check failed: ${cause}`);
    res.status(503).json({
      status: 'ERROR',
      services: { api: 'ACTIVE', database: 'INACTIVE' },
      timestamp: new Date()
    });
  }
});


const errorHandler = require('./middleware/errorHandler');

app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use(errorHandler);

const SHUTDOWN_GRACE_MS = 10 * 1000;

async function startServer() {
  await initDb();

  const skillRegistry = require('./modules/assessments/question-bank/skills/registryCache');

  // Non-fatal: an unseeded registry degrades to raw name matching.
  skillRegistry.load().catch((err) => {
    console.warn('[skill-registry] load failed, falling back to raw name matching:', err.message);
  });

  const { ensureGlobalCommunity } = require('./modules/community/services/community.service');

  // Job retention (slims and later deletes old jobs; never on a user's request).
  const stopJobRetention = require('./modules/jobs/jobLifecycle.service').startJobRetention(prisma);

  // Email queue worker (only when REDIS_URL is set; otherwise emails are sent directly).
  require('./infrastructure/email/emailQueue').startEmailQueue();

  // One HTTP server for the API and the realtime (Socket.IO) connections, on the same port.
  const { attachRealtime, closeRealtime } = require('./modules/gigs/gigRealtime');
  const server = http.createServer(app);
  attachRealtime(server);

  // Graceful shutdown (PM2 and containers send SIGINT / SIGTERM on stop, restart and deploy):
  // stop taking new connections, let requests in progress finish, then close the database,
  // Redis and email-queue connections. Anything still running after 10 s is cut off.
  let stopping = false;
  const shutdown = (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(`[server] ${signal} received: finishing requests in progress, then stopping.`);
    setTimeout(() => {
      console.error('[server] Requests still running after 10 s; stopping anyway.');
      process.exit(1);
    }, SHUTDOWN_GRACE_MS).unref();
    stopJobRetention();
    server.close(async () => {
      await Promise.allSettled([
        require('./infrastructure/email/emailQueue').stopEmailQueue(),
        require('./infrastructure/redis').closeRedis(),
        prisma.$disconnect()
      ]);
      console.log('[server] Stopped cleanly.');
      process.exit(0);
    });
    closeRealtime().catch(() => {});
    server.closeIdleConnections(); // idle keep-alive connections would otherwise hold close() open
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Initialize Global Community at application startup
    ensureGlobalCommunity().catch(err => {
      console.warn('[community] Global community startup initialization skipped:', err.message);
    });
  });
}

startServer();

