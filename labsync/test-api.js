const https = require('https');

const options = {
  hostname: 'labsync-seven.vercel.app',
  port: 443,
  path: '/api/seed',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();