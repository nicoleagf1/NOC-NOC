import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
import fs from 'fs';
import crypto from 'crypto';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env.local');
let secret = '';
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
      if (key === 'APP_SECRET') secret = value;
    }
  });
}

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secret, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  const client = await pool.connect();
  try {
    const newCreds = encrypt('administrador:S1stemas3031*.');
    await client.query("UPDATE monitoring_connections SET auth_credentials = $1 WHERE type = 'uptime-kuma'", [newCreds]);
    console.log("Kuma Connection updated with correct username and password format.");
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
