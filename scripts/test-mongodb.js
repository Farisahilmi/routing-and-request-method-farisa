// Test MongoDB Connection
// Run: node scripts/test-mongodb.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

// Connection string dengan database name: simple-store
// Password perlu di-URL-encode jika mengandung karakter khusus (!, @, #, dll)
// "Faris123!" menjadi "Faris123%21"
const uri = process.env.MONGODB_URI || 'mongodb+srv://farisahilmiexe_db_user:Faris123%21@database1.iwpievn.mongodb.net/simple-store?retryWrites=true&w=majority';

async function testConnection() {
  console.log('🔌 Testing MongoDB connection...');
  console.log('URI:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password
  console.log('\n💡 Tips:');
  console.log('   - Jika password mengandung karakter khusus (!, @, #, dll), perlu di-URL-encode');
  console.log('   - Contoh: "Faris123!" → "Faris123%21"');
  console.log('   - Atau gunakan connection string dari MongoDB Atlas (sudah auto-encoded)\n');
  
  let client = null;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test database
    const db = client.db();
    const dbName = db.databaseName;
    console.log(`📦 Database: ${dbName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📚 Collections: ${collections.length}`);
    if (collections.length > 0) {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log('   (No collections yet)');
    }
    
    // Test write
    const testCollection = db.collection('test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Write test: SUCCESS');
    
    // Test read
    const result = await testCollection.findOne({ test: true });
    console.log('✅ Read test: SUCCESS');
    
    // Cleanup
    await testCollection.deleteMany({ test: true });
    console.log('✅ Cleanup: SUCCESS');
    
    console.log('\n🎉 All tests passed! MongoDB is ready to use.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if MongoDB Atlas cluster is running');
    console.error('2. Verify network access (0.0.0.0/0)');
    console.error('3. Check username and password');
    console.error('4. Verify connection string format');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Connection closed');
    }
  }
}

testConnection();

