import fs from 'fs';
import { SignJWT } from 'jose';
import http from 'http';

const envConfig = fs.readFileSync('.env.local', 'utf-8');
let secretStr = '';
envConfig.split('\n').forEach(line => {
  if (line.startsWith('APP_SECRET=')) {
    secretStr = line.split('=')[1].trim();
  }
});

async function run() {
  const secretKey = new TextEncoder().encode(secretStr);
  const token = await new SignJWT({ userId: 'debug' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey);

  const postData = JSON.stringify({
    name: "Debug Eureka",
    slug: "debug-eureka-" + Date.now(),
    endpoint_url: "https://eurka.vepagos.com"
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/services',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Cookie': `noc_session=${token}`
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`BODY: ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
}
run();
