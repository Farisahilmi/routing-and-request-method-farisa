// Vercel KV Database Helper
// Use this for Vercel KV storage (built-in Vercel database)
// Setup: Vercel Dashboard → Storage → Create KV Database
// Environment variables (KV_REST_API_URL, KV_REST_API_TOKEN) are auto-set by Vercel

let kv = null;

// Initialize Vercel KV
function initKV() {
  if (kv) return kv;
  
  try {
    // Try to use @vercel/kv package
    kv = require('@vercel/kv');
    console.log('✅ Vercel KV initialized');
    return kv;
  } catch (error) {
    console.warn('⚠️ @vercel/kv not available, using REST API fallback');
    return null;
  }
}

// Read data from Vercel KV
async function readJSONFile(filename) {
  try {
    const kvClient = initKV();
    const collectionName = filename.replace('.json', '');
    
    if (kvClient) {
      // Use @vercel/kv package
      const data = await kvClient.get(collectionName);
      return data || [];
    } else {
      // Fallback to REST API
      return await readJSONFileREST(filename);
    }
  } catch (error) {
    console.error(`❌ Error reading ${filename} from Vercel KV:`, error.message);
    return [];
  }
}

// Write data to Vercel KV
async function writeJSONFile(filename, data) {
  try {
    const kvClient = initKV();
    const collectionName = filename.replace('.json', '');
    
    if (kvClient) {
      // Use @vercel/kv package
      await kvClient.set(collectionName, data);
      return true;
    } else {
      // Fallback to REST API
      return await writeJSONFileREST(filename, data);
    }
  } catch (error) {
    console.error(`❌ Error writing ${filename} to Vercel KV:`, error.message);
    return false;
  }
}

// REST API fallback (if @vercel/kv not available)
async function readJSONFileREST(filename) {
  const KV_REST_API_URL = process.env.KV_REST_API_URL;
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
  
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    console.error('❌ Vercel KV credentials not found');
    return [];
  }

  try {
    const collectionName = filename.replace('.json', '');
    const url = `${KV_REST_API_URL}/get/${collectionName}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${KV_REST_API_TOKEN}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.result || [];
  } catch (error) {
    console.error(`❌ Error reading ${filename} from Vercel KV REST:`, error.message);
    return [];
  }
}

async function writeJSONFileREST(filename, data) {
  const KV_REST_API_URL = process.env.KV_REST_API_URL;
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;
  
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    console.error('❌ Vercel KV credentials not found');
    return false;
  }

  try {
    const collectionName = filename.replace('.json', '');
    const url = `${KV_REST_API_URL}/set/${collectionName}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error writing ${filename} to Vercel KV REST:`, error.message);
    return false;
  }
}

// Clear cache (not needed for KV, but kept for compatibility)
function clearCache(filename = null) {
  return true;
}

module.exports = {
  readJSONFile,
  writeJSONFile,
  clearCache
};

