const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/magalir_kuzhu';
const DB_NAME = process.env.DB_NAME || 'magalir_kuzhu';

let client = null;
let db = null;

// In-memory cache synced with MongoDB
const cache = {};
let isInitialized = false;

const COLLECTIONS = [
  'users',
  'groups',
  'loans',
  'repayments',
  'repayment_schedules',
  'messages',
  'announcements',
  'notifications',
  'email_outbox',
  'emails',
  'audit_logs',
  'daily_penalties'
];

/**
 * Connect to MongoDB and synchronize existing data or collections
 */
async function connectDb() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`[MONGODB] Connected successfully to MongoDB at ${MONGODB_URI}`);

    // Preload collections into memory cache and ensure MongoDB collections have data
    for (const collName of COLLECTIONS) {
      const coll = db.collection(collName);
      let docs = await coll.find({}, { projection: { _id: 0 } }).toArray();

      // If MongoDB collection is empty, check if we have server/data/*.json to migrate
      if (docs.length === 0) {
        const jsonPath = path.join(__dirname, 'data', `${collName}.json`);
        if (fs.existsSync(jsonPath)) {
          try {
            const raw = fs.readFileSync(jsonPath, 'utf8');
            const parsed = JSON.parse(raw || '[]');
            if (Array.isArray(parsed) && parsed.length > 0) {
              await coll.insertMany(parsed.map(item => ({ ...item })));
              docs = parsed;
              console.log(`[MONGODB] Migrated ${parsed.length} records from ${collName}.json into MongoDB.`);
            }
          } catch (e) {
            console.error(`[MONGODB] Error migrating ${collName}:`, e.message);
          }
        }
      }

      cache[collName] = docs;
    }

    // Seed Super Admin if missing
    await seedSuperAdmin();
    // Seed initial announcements if missing
    await seedInitialData();

    isInitialized = true;
    return db;
  } catch (err) {
    console.error('[MONGODB] Connection error:', err.message);
    console.log('[MONGODB] Falling back to file storage if MongoDB is not accessible');
    // Fallback loading from files
    for (const collName of COLLECTIONS) {
      cache[collName] = readCollectionFromFile(collName);
    }
  }
}

/**
 * Seed master Super Admin account
 */
async function seedSuperAdmin() {
  const users = cache['users'] || [];
  const superAdminEmail = 'sherasanjayn@gmail.com';
  
  const existing = users.find(u => u.email && u.email.toLowerCase() === superAdminEmail.toLowerCase());
  if (!existing) {
    const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@12345';
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(defaultPassword, salt);
    
    const masterAdmin = {
      id: 'super-admin-01',
      name: 'Super Admin',
      phone: '9876543210',
      email: superAdminEmail,
      password_hash,
      area: 'HQ Central',
      district: 'Chennai',
      status: 'APPROVED',
      role: 'SUPER_ADMIN',
      group_id: null,
      created_at: new Date().toISOString()
    };
    
    users.push(masterAdmin);
    writeCollection('users', users);
    console.log(`[SEED] Super Admin master account seeded with email: ${superAdminEmail}`);
  }
}

/**
 * Seed initial announcement
 */
async function seedInitialData() {
  const announcements = cache['announcements'] || [];
  if (announcements.length === 0) {
    const initialAnn = {
      id: 'ann-001',
      title: 'Welcome to Magalir Kuzhu Portal | மகளிர் குழு போர்ட்டல்',
      message: 'Greetings to all members! Our platform enables Self-Help Group empowerment, financial mutual assistance, real-time group communication, and transparent 3-step loan approval & repayment workflows.',
      created_by: 'Super Admin',
      created_at: new Date().toISOString()
    };
    announcements.push(initialAnn);
    writeCollection('announcements', announcements);
  }
}

function getFilePath(collection) {
  const DATA_DIR = path.join(__dirname, 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  return path.join(DATA_DIR, `${collection}.json`);
}

function readCollectionFromFile(collection) {
  const file = getFilePath(collection);
  if (!fs.existsSync(file)) {
    return [];
  }
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

function writeCollectionToFile(collection, data) {
  try {
    const file = getFilePath(collection);
    const tempFile = `${file}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, file);
  } catch (e) {
    // ignore
  }
}

/**
 * Synchronous read accessor (reads from real-time in-memory cache)
 */
function readCollection(collection) {
  if (!cache[collection]) {
    cache[collection] = readCollectionFromFile(collection);
  }
  return cache[collection];
}

/**
 * Synchronous write mutator that updates in-memory cache,
 * writes backup JSON, and asynchronously syncs with MongoDB collection.
 */
function writeCollection(collection, data) {
  cache[collection] = data;

  // Persist to backup file
  writeCollectionToFile(collection, data);

  // Sync with MongoDB in the background
  if (db) {
    const coll = db.collection(collection);
    (async () => {
      try {
        await coll.deleteMany({});
        if (Array.isArray(data) && data.length > 0) {
          // Clone objects to avoid mutation of _id
          const docs = data.map(doc => ({ ...doc }));
          await coll.insertMany(docs);
        }
      } catch (err) {
        console.error(`[MONGODB] Error syncing collection ${collection}:`, err.message);
      }
    })();
  }
}

function initDb() {
  return connectDb();
}

function getDb() {
  return db;
}

module.exports = {
  connectDb,
  getDb,
  readCollection,
  writeCollection,
  initDb
};
