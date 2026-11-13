const app = require('./app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/database');

function startServer() {
  // Listen first: an unreachable DB makes connectDB() block until the pool's connection
  // timeout, which would otherwise delay listen() past deploy health checks.
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Admin Portal Backend running on port ${env.PORT} (0.0.0.0)`);
  });

  server.on('error', (err) => {
    console.error(`Failed to start server on port ${env.PORT}:`, err.message);
    process.exit(1);
  });

  // Logs whether PostgreSQL answers; requests fail with the real cause while it doesn't.
  connectDB();
}

startServer();
