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

app.use(cors());
// Raw-body parser for the upload proxy. The cap follows the largest per-type
// limit in upload.config.js (securePut enforces the exact per-type limit), and
// auth runs first so unauthenticated requests are rejected before buffering.
const SECURE_PUT_RAW_LIMIT = Math.max(...Object.values(uploadConfig.limits));
app.use(['/api/upload/secure-put', '/upload/secure-put'], authMiddleware, express.raw({ limit: SECURE_PUT_RAW_LIMIT, type: '*/*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Mount API routes under /api and root namespace so clients requesting
// either https://backend.aligngrad.com/api/... or https://backend.aligngrad.com/... resolve seamlessly
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.get('/health', async (req, res) => {
  try {
    // Perform a lightweight database operation to verify connectivity (e.g. check user count)
    await prisma.user.count();
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

async function startServer() {
  await initDb();

  const skillRegistry = require('./modules/assessments/question-bank/skills/registryCache');

  // Non-fatal: an unseeded registry degrades to raw name matching.
  skillRegistry.load().catch((err) => {
    console.warn('[skill-registry] load failed, falling back to raw name matching:', err.message);
  });

  const { ensureGlobalCommunity } = require('./modules/community/services/community.service');

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Initialize Global Community at application startup
    ensureGlobalCommunity().catch(err => {
      console.warn('[community] Global community startup initialization skipped:', err.message);
    });
  });
}

startServer();

