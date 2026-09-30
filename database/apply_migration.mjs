import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function applyMigration() {
  console.log(`Conectando a PostgreSQL en ${process.env.DB_HOST}:${process.env.DB_PORT} (DB: ${process.env.DB_NAME})...`);
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, '04_backup_module_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Aplicando migración: 04_backup_module_schema.sql...');
    await client.query(sql);
    console.log('¡Migración de Fase 1 aplicada exitosamente!');

    // Comprobar conteos
    const jobsRes = await client.query('SELECT count(*) FROM backup_jobs');
    const historyRes = await client.query('SELECT count(*) FROM backup_history');
    console.log(`Jobs registrados: ${jobsRes.rows[0].count}`);
    console.log(`Registros de historial: ${historyRes.rows[0].count}`);
  } catch (error) {
    console.error('Error aplicando migración:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
