#!/usr/bin/env node
const http = require('http');

console.log('Testing Reviews API Endpoints...\n');

// Test 1: Get reviews for product 1
console.log('Test 1: GET /api/reviews/product/1');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/reviews/product/1',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response:', data);
    }
    console.log('\n✅ Test 1 Complete\n');
    process.exit(0);
  });
});

req.on('error', (e) => { 
  console.error('❌ Error:', e.message); 
  process.exit(1);
});
req.end();
