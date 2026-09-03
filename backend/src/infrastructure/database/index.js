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

let initPromise = null;

function isConnectionError(err) {
  if (!err) return false;
  const msg = err.message || '';
  const name = err.name || '';
  return (
    name === 'PrismaClientInitializationError' ||
    (name === 'PrismaClientKnownRequestError' && err.code === 'P1001') ||
    msg.includes('Error creating a database connection') ||
    msg.includes('DNS resolution') ||
    msg.includes('connection timed out') ||
    msg.includes('Can\'t reach database server')
  );
}

function switchToMock(reason) {
  if (!useMock) {
    console.warn(`[DATABASE CONNECT FAIL] ${reason}. Falling back to mock datastore.`);
    useMock = true;
    activeClient = mockClient;
  }
}

async function checkDbConnection() {
  if (useMock || !prismaInstance) return false;
  try {
    const connectionCheck = prismaInstance.user.count();
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timed out')), 5000)
    );

    const count = await Promise.race([connectionCheck, timeout]);
    console.log(`Successfully connected to MongoDB database. User seed count: ${count}`);
    return true;
  } catch (err) {
    switchToMock(err.message);
    return false;
  }
}

if (!useMock && prismaInstance) {
  initPromise = checkDbConnection();
} else {
  initPromise = Promise.resolve(false);
}

async function initDb() {
  if (initPromise) {
    await initPromise;
  }
  return !useMock;
}

// Proxy wrapper so we can dynamically swap out the active client if connection fails or model is unindexed
const prismaProxy = new Proxy({}, {
  get(target, prop) {
    let client = activeClient || mockClient;
    if (client && !(prop in client) && mockClient && (prop in mockClient)) {
      client = mockClient;
    }
    const val = client ? client[prop] : undefined;

    if (typeof val === 'function') {
      return async function (...args) {
        if (initPromise) {
          await initPromise;
        }

        let currentClient = activeClient || mockClient;
        let fn = currentClient ? currentClient[prop] : undefined;

        if (typeof fn !== 'function') {
          fn = mockClient[prop];
          currentClient = mockClient;
        }

        try {
          return await fn.apply(currentClient, args);
        } catch (err) {
          if (!useMock && isConnectionError(err)) {
            switchToMock(err.message);
            const fallbackFn = mockClient[prop];
            if (typeof fallbackFn === 'function') {
              return await fallbackFn.apply(mockClient, args);
            }
          }
          throw err;
        }
      };
    }

    if (val && typeof val === 'object') {
      return new Proxy(val, {
        get(subTarget, subProp) {
          const subVal = subTarget[subProp];
          if (typeof subVal === 'function') {
            return async function (...subArgs) {
              if (initPromise) {
                await initPromise;
              }

              let currentClient = activeClient || mockClient;
              let currentModel = currentClient ? currentClient[prop] : undefined;

              if (!currentModel) {
                currentModel = mockClient[prop];
                currentClient = mockClient;
              }

              let subFn = currentModel ? currentModel[subProp] : undefined;
              if (typeof subFn !== 'function' && mockClient[prop]) {
                subFn = mockClient[prop][subProp];
                currentModel = mockClient[prop];
              }

              try {
                return await subFn.apply(currentModel, subArgs);
              } catch (err) {
                if (!useMock && isConnectionError(err)) {
                  switchToMock(err.message);
                  const fallbackModel = mockClient[prop];
                  const fallbackFn = fallbackModel ? fallbackModel[subProp] : undefined;
                  if (typeof fallbackFn === 'function') {
                    return await fallbackFn.apply(fallbackModel, subArgs);
                  }
                }
                throw err;
              }
            };
          }
          return subVal;
        }
      });
    }

    return val;
  }
});

module.exports = {
  prisma: prismaProxy,
  isMock: () => useMock,
  initDb
};

