import pg from 'pg';
import fs from 'fs';
const envConfig = fs.readFileSync('.env.local', 'utf-8');
envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[match[1]] = value;
    }
});
const pool = new pg.Pool({
  host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT||'5432'), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD
});
async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT tgname, tgrelid::regclass, tgtype FROM pg_trigger WHERE tgrelid = 'infrastructure_hosts'::regclass;");
    console.log(res.rows);
  } finally {
    client.release();
    await pool.end();
  }
}
run();
