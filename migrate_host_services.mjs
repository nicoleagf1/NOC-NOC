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
    console.log('Iniciando migración para CMDB/Vault (Host Services)...');
    await client.query('BEGIN');

    // 1. Añadir columna server_role a infrastructure_hosts
    console.log('1. Añadiendo columna server_role a infrastructure_hosts...');
    await client.query(`
      ALTER TABLE infrastructure_hosts 
      ADD COLUMN IF NOT EXISTS server_role VARCHAR(100) DEFAULT 'Sin Asignar';
    `);

    // 2. Crear tabla intermedia host_services
    console.log('2. Creando tabla intermedia host_services...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS host_services (
        host_id UUID NOT NULL,
        service_id UUID NOT NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (host_id, service_id),
        CONSTRAINT fk_host_services_host FOREIGN KEY (host_id) REFERENCES infrastructure_hosts(id) ON DELETE CASCADE,
        CONSTRAINT fk_host_services_service FOREIGN KEY (service_id) REFERENCES business_services(id) ON DELETE CASCADE
      );
    `);

    // 3. Crear índices para búsquedas rápidas
    console.log('3. Creando índices de optimización...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_host_services_service_id ON host_services(service_id);
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
