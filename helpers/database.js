const fs = require('fs');
const path = require('path');

// Check which database to use (priority order)
// 1. Vercel KV (built-in, no setup needed)
// 2. MongoDB (if MONGODB_URI is set)
// 3. File system (fallback)

const useVercelKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const useMongoDB = process.env.MONGODB_URI && (process.env.VERCEL || process.env.NODE_ENV === 'production');

// Dynamically load database helpers
let kvHelper = null;
let mongoHelper = null;

if (useVercelKV) {
  try {
    kvHelper = require('./database-vercel-kv');
    console.log('📦 Using Vercel KV for database operations');
  } catch (error) {
    console.warn('⚠️ Vercel KV helper not available:', error.message);
  }
} else if (useMongoDB) {
  try {
    mongoHelper = require('./database-mongodb');
    console.log('📦 Using MongoDB for database operations');
  } catch (error) {
    console.warn('⚠️ MongoDB helper not available, falling back to file system');
  }
}

// Simple in-memory cache (only for file system)
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Sync version for backward compatibility
// NOTE: For Vercel KV/MongoDB, this will return empty array. Use readJSONFileAsync instead.
const readJSONFile = (filename) => {
  // Use Vercel KV if available
  if (useVercelKV && kvHelper) {
    // Vercel KV requires async, but this is sync function
    console.warn(`⚠️ readJSONFile('${filename}') called in sync context with Vercel KV. Use readJSONFileAsync() instead.`);
    return [];
  }
  
  // Use MongoDB if available
  if (useMongoDB && mongoHelper) {
    // MongoDB requires async, but this is sync function
    // Return empty array and log warning
    console.warn(`⚠️ readJSONFile('${filename}') called in sync context with MongoDB. Use readJSONFileAsync() instead.`);
    console.warn('⚠️ Returning empty array. Update route to use async/await for MongoDB support.');
    return [];
  }

  // Fallback to file system (sync)
  const cacheKey = filename;
  const cached = cache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  const filePath = path.join(__dirname, '../data', filename);
  
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    if (!data) {
      return [];
    }
    const parsedData = JSON.parse(data);
    
    // Cache the data
    cache.set(cacheKey, {
      data: parsedData,
      timestamp: Date.now()
    });
    
    return parsedData;
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return [];
  }
};

// Async version for Vercel KV/MongoDB
const readJSONFileAsync = async (filename) => {
  if (useVercelKV && kvHelper) {
    return await kvHelper.readJSONFile(filename);
  }
  if (useMongoDB && mongoHelper) {
    return await mongoHelper.readJSONFile(filename);
  }
  // For file system, return sync result as resolved promise
  return Promise.resolve(readJSONFile(filename));
};

// Sync version for backward compatibility
// NOTE: For Vercel KV/MongoDB, this will return false. Use writeJSONFileAsync instead.
const writeJSONFile = (filename, data) => {
  // Use Vercel KV if available
  if (useVercelKV && kvHelper) {
    // Vercel KV requires async, but this is sync function
    console.warn(`⚠️ writeJSONFile('${filename}') called in sync context with Vercel KV. Use writeJSONFileAsync() instead.`);
    return false;
  }
  
  // Use MongoDB if available
  if (useMongoDB && mongoHelper) {
    // MongoDB requires async, but this is sync function
    // Return false and log warning
    console.warn(`⚠️ writeJSONFile('${filename}') called in sync context with MongoDB. Use writeJSONFileAsync() instead.`);
    console.warn('⚠️ Write operation failed. Update route to use async/await for MongoDB support.');
    return false;
  }

  // Fallback to file system
  const filePath = path.join(__dirname, '../data', filename);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    // Clear cache for this file
    cache.delete(filename);
    
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filename}:`, error.message);
    // In Vercel, file system is read-only, so this will fail
    if (process.env.VERCEL) {
      console.error('⚠️ Vercel filesystem is read-only. Please use MongoDB for write operations.');
    }
    return false;
  }
};

// Async version for Vercel KV/MongoDB
const writeJSONFileAsync = async (filename, data) => {
  if (useVercelKV && kvHelper) {
    return await kvHelper.writeJSONFile(filename, data);
  }
  if (useMongoDB && mongoHelper) {
    return await mongoHelper.writeJSONFile(filename, data);
  }
  // For file system, return sync result as resolved promise
  return Promise.resolve(writeJSONFile(filename, data));
};

const clearCache = (filename = null) => {
  if (filename) {
    cache.delete(filename);
  } else {
    cache.clear();
  }
};

module.exports = {
  readJSONFile,
  readJSONFileAsync,
  writeJSONFile,
  writeJSONFileAsync,
  clearCache
};