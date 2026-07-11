const app = require('./app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/database');

async function startServer() {
  try {
    // Attempt DB connection on start
    await connectDB().catch(err => {
      console.warn('[DB WARNING] Could not establish live MongoDB connection. Analytics will use fallback data.', err.message);
    });

    app.listen(env.PORT, () => {
      console.log(`Admin Portal Backend running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
