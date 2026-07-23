import fs from 'fs';
import http from 'http';
import https from 'https';

const envConfig = fs.readFileSync('.env.local', 'utf-8');
let promUrl = '';
envConfig.split('\n').forEach(line => {
  if (line.startsWith('PROMETHEUS_URL=')) {
    promUrl = line.split('=')[1].trim();
  }
});

const client = promUrl.startsWith('https') ? https : http;

client.get(`${promUrl}/api/v1/query?query=monitor_status`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log("Prometheus Response:", data));
}).on('error', err => console.error(err));
