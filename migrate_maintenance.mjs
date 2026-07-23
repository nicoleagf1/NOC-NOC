import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
import fs from 'fs';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
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
    console.log("Alterando tabla business_services para añadir is_maintenance...");
    await client.query(`
      ALTER TABLE business_services
      ADD COLUMN IF NOT EXISTS is_maintenance BOOLEAN DEFAULT false;
    `);
    console.log("Columna is_maintenance (BOOLEAN) añadida con éxito.");
  } catch (err) {
    console.error("Error ejecutando alteración:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
