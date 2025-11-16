// Helper script untuk fix connection string dengan URL encoding
// Run: node scripts/fix-connection-string.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function encodePassword(password) {
  // URL encode password untuk karakter khusus
  return encodeURIComponent(password);
}

function buildConnectionString(username, password, cluster, database) {
  const encodedPassword = encodePassword(password);
  return `mongodb+srv://${username}:${encodedPassword}@${cluster}/${database}?retryWrites=true&w=majority`;
}

console.log('🔧 MongoDB Connection String Helper\n');
console.log('Masukkan informasi MongoDB Anda:\n');

rl.question('Username: ', (username) => {
  rl.question('Password: ', (password) => {
    rl.question('Cluster (contoh: database1.iwpievn.mongodb.net): ', (cluster) => {
      rl.question('Database name (default: simple-store): ', (database) => {
        const dbName = database || 'simple-store';
        
        const connectionString = buildConnectionString(username, password, cluster, dbName);
        const encodedPassword = encodePassword(password);
        
        console.log('\n✅ Connection String yang sudah di-encode:');
        console.log(connectionString);
        console.log('\n📝 Password yang di-encode:');
        console.log(`   Original: ${password}`);
        console.log(`   Encoded:  ${encodedPassword}`);
        console.log('\n💡 Copy connection string di atas dan paste ke:');
        console.log('   1. Environment variable MONGODB_URI di Vercel');
        console.log('   2. File .env (untuk local development)');
        console.log('\n⚠️  Jangan share connection string ini ke public!');
        
        rl.close();
      });
    });
  });
});

