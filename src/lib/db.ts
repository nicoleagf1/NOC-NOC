import { Pool } from 'pg';

// Mantenemos un único pool de conexiones en la aplicación Next.js
// para no agotar las conexiones de PostgreSQL durante el hot-reloading en desarrollo.
const globalForPg = global as unknown as { pgPool: Pool };

export const pool =
  globalForPg.pgPool ||
  new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Configuraciones recomendadas para evitar locks
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

export const query = (text: string, params?: any[]) => pool.query(text, params);
