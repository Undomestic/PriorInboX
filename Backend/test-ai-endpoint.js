// Test script to check if the AI endpoint works
const http = require('http');

const postData = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/ai/analyze-emails',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer test-token'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('BODY:', data);
  });
});

req.on('error', (error) => {
  console.error('ERROR:', error);
});

req.write(postData);
req.end();
