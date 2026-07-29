import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Iniciando migración para Vault Credentials...');
    await client.query('BEGIN');

    // Añadir columnas de usuario y contraseña encriptada a infrastructure_hosts
    console.log('Añadiendo vault_username y vault_password...');
    await client.query(`
      ALTER TABLE infrastructure_hosts 
      ADD COLUMN IF NOT EXISTS vault_username VARCHAR(255),
      ADD COLUMN IF NOT EXISTS vault_password TEXT;
    `);

    await client.query('COMMIT');
    console.log('Migración completada exitosamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la migración, rollback ejecutado:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
