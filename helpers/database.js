const fs = require('fs');
const path = require('path');

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

const readJSONFile = (filename) => {
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

const writeJSONFile = (filename, data) => {
  const filePath = path.join(__dirname, '../data', filename);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    // Clear cache for this file
    cache.delete(filename);
    
    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filename}:`, error.message);
    return false;
  }
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
  writeJSONFile,
  clearCache
};