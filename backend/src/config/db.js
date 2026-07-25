const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const { mockClient } = require('./mock/mockClient');
dotenv.config();

let prismaInstance;
let useMock = false;
let activeClient;

try {
  if (process.env.DATABASE_URL) {
    prismaInstance = new PrismaClient();
    activeClient = prismaInstance;
    console.log('Prisma Client initialized.');
  } else {
    console.warn('DATABASE_URL not found. Using mock client fallback.');
    useMock = true;
    activeClient = mockClient;
  }
} catch (e) {
  console.error('Failed to initialize Prisma client. Using mock fallback:', e.message);
  useMock = true;
  activeClient = mockClient;
}

// Proxy wrapper so we can dynamically swap out the active client if connection fails or model is unindexed
const prismaProxy = new Proxy({}, {
  get(target, prop) {
    const client = (activeClient && activeClient[prop]) ? activeClient : mockClient;
    const val = client ? client[prop] : undefined;
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  }
});

// Perform async connection check on startup if not already using mock
if (!useMock && prismaInstance) {
  const connectionCheck = prismaInstance.user.count();
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Database connection timed out')), 10000)
  );

  Promise.race([connectionCheck, timeout])
    .then((count) => {
      console.log(`Successfully connected to MongoDB database. Seed count: ${count}`);
    })
    .catch((err) => {
      console.warn(`[DATABASE CONNECT FAIL] ${err.message}. Falling back to mock datastore.`);
      useMock = true;
      activeClient = mockClient;
    });
}

module.exports = {
  prisma: prismaProxy,
  isMock: () => useMock
};
