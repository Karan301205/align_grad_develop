const { MongoClient } = require('mongodb');
const env = require('./env');

let client = null;
let db = null;

async function connectDB() {
  if (db) return db;
  try {
    client = new MongoClient(env.DATABASE_URL);
    await client.connect();
    db = client.db();
    console.log('MongoDB successfully connected for Admin Portal');
    return db;
  } catch (err) {
    console.error('MongoDB database connection error:', err.message);
    throw err;
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

module.exports = {
  connectDB,
  getDB
};
