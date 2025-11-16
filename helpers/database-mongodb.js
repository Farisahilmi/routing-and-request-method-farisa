// MongoDB Database Helper
// Use this instead of database.js for Vercel deployment
const { MongoClient } = require('mongodb');

let client = null;
let db = null;

// Initialize MongoDB connection
async function initMongoDB() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in environment variables');
    return null;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    const dbName = uri.split('/').pop().split('?')[0] || 'simple-store';
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return null;
  }
}

// Get collection
async function getCollection(collectionName) {
  const database = await initMongoDB();
  if (!database) return null;
  return database.collection(collectionName);
}

// Read data from MongoDB (equivalent to readJSONFile)
async function readJSONFile(filename) {
  try {
    const collectionName = filename.replace('.json', '');
    const collection = await getCollection(collectionName);
    if (!collection) return [];

    const documents = await collection.find({}).toArray();
    return documents;
  } catch (error) {
    console.error(`❌ Error reading ${filename} from MongoDB:`, error.message);
    return [];
  }
}

// Write data to MongoDB (equivalent to writeJSONFile)
async function writeJSONFile(filename, data) {
  try {
    const collectionName = filename.replace('.json', '');
    const collection = await getCollection(collectionName);
    if (!collection) return false;

    // If data is array, use bulk operations
    if (Array.isArray(data)) {
      // Delete all existing documents
      await collection.deleteMany({});
      // Insert new documents
      if (data.length > 0) {
        await collection.insertMany(data);
      }
    } else {
      // Single document
      await collection.deleteMany({});
      await collection.insertOne(data);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filename} to MongoDB:`, error.message);
    return false;
  }
}

// Clear cache (not needed for MongoDB, but kept for compatibility)
function clearCache(filename = null) {
  // MongoDB doesn't need cache clearing
  return true;
}

// Close MongoDB connection
async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
}

module.exports = {
  readJSONFile,
  writeJSONFile,
  clearCache,
  initMongoDB,
  closeConnection
};

