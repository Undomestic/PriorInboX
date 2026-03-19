const http = require('http');

// Test demo account login
const testLogin = () => {
  const postData = JSON.stringify({
    email: 'demo@priorinbox.com',
    password: 'Demo@123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('✅ Login test PASSED!');
        console.log('📧 Email: demo@priorinbox.com');
        console.log('🔑 Password: Demo@123');
        console.log('👤 Username:', response.user.username);
        console.log('🎫 Token received:', response.token ? 'Yes' : 'No');
      } else {
        console.log('❌ Login test FAILED!');
        console.log('Status Code:', res.statusCode);
        try {
          const error = JSON.parse(data);
          console.log('Error:', error.message);
        } catch (e) {
          console.log('Response:', data);
        }
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ Connection Error:', e.message);
    console.log('');
    console.log('💡 Make sure the backend server is running:');
    console.log('   cd Backend');
    console.log('   npm start');
  });

  req.write(postData);
  req.end();
};

console.log('🧪 Testing demo account login...');
console.log('');
testLogin();
