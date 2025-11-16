// Migrate data from JSON files to MongoDB
// Run: node scripts/migrate-to-mongodb.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Connection string dengan database name: simple-store
const uri = process.env.MONGODB_URI || 'mongodb+srv://farisahilmiexe_db_user:Faris123!@database1.iwpievn.mongodb.net/simple-store?retryWrites=true&w=majority';
const dataDir = path.join(__dirname, '../data');

const filesToMigrate = [
  'users.json',
  'products.json',
  'orders.json',
  'cart.json',
  'addresses.json',
  'reviews.json'
];

async function migrateData() {
  console.log('🚀 Starting migration from JSON files to MongoDB...\n');
  
  let client = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    console.log(`✅ Connected to MongoDB: ${db.databaseName}\n`);
    
    // Migrate each file
    for (const filename of filesToMigrate) {
      const filePath = path.join(dataDir, filename);
      const collectionName = filename.replace('.json', '');
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${filename} not found, skipping...`);
        continue;
      }
      
      try {
        // Read JSON file
        const fileData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileData);
        
        if (!Array.isArray(data) || data.length === 0) {
          console.log(`⚠️  ${filename} is empty, skipping...`);
          continue;
        }
        
        // Get collection
        const collection = db.collection(collectionName);
        
        // Check if collection already has data
        const existingCount = await collection.countDocuments();
        if (existingCount > 0) {
          console.log(`⚠️  ${collectionName} already has ${existingCount} documents.`);
          console.log(`   Do you want to replace? (This will delete existing data)`);
          console.log(`   Skipping for safety. Delete collection manually if you want to replace.\n`);
          continue;
        }
        
        // Insert data
        await collection.insertMany(data);
        console.log(`✅ Migrated ${data.length} documents to ${collectionName}`);
        
      } catch (error) {
        console.error(`❌ Error migrating ${filename}:`, error.message);
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('\n📊 Summary:');
    for (const filename of filesToMigrate) {
      const collectionName = filename.replace('.json', '');
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`   ${collectionName}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Connection closed');
    }
  }
}

migrateData();

