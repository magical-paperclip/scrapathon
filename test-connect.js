const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
};

console.log('Testing server connectivity on port 3000...');

const req = http.request(options, (res) => {
  console.log('✅ Server responding! Status:', res.statusCode);
  res.on('data', (chunk) => {
    console.log('Response:', chunk.toString().substring(0, 200) + '...');
  });
});

req.on('error', (e) => {
  console.error('❌ Server not responding:', e.message);
});

req.end();
