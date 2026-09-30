import { NextResponse } from 'next/server';
import { Client as SSHClient } from 'ssh2';
import sql from 'mssql';
import pg from 'pg';
import net from 'net';
import { backupJobService } from '@/lib/services/backupJobService';
import { decrypt } from '@/lib/security';

interface DiscoverRequest {
  engine: string;
  host: string;
  port: number;
  db_username: string;
  db_password?: string;
  use_ssh_tunnel?: boolean;
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  ssh_password?: string;
  show_system_databases?: boolean;
  job_id?: string; // Si se provee, lee contraseñas de la BD
}

/**
 * POST /api/backups/discover-databases
 * Conecta al servidor y lista las bases de datos disponibles.
 * Soporta: PostgreSQL, MySQL (SSH), MSSQL
 * Si job_id está presente, usa las contraseñas almacenadas en BD.
 */
export async function POST(request: Request) {
  try {
    const body: DiscoverRequest = await request.json();
    let { engine, host, port, db_username, db_password, show_system_databases } = body;

    if (!engine || !host || !db_username) {
      return NextResponse.json({ error: 'Faltan campos obligatorios: engine, host, db_username' }, { status: 400 });
    }

    // Si hay job_id y no se envió contraseña, leer de la BD
    if (body.job_id && (!db_password || db_password.trim() === '')) {
      const job = await backupJobService.getJobById(body.job_id);
      if (job) {
        db_password = job.db_password_encrypted ? decrypt(job.db_password_encrypted) : '';
        body.db_password = db_password;
        // También recuperar SSH password si aplica
        if (body.use_ssh_tunnel && (!body.ssh_password || body.ssh_password.trim() === '')) {
          body.ssh_password = job.ssh_password_encrypted ? decrypt(job.ssh_password_encrypted) : '';
        }
      }
    }

    if (!db_password) {
      return NextResponse.json({ error: 'Se requiere contraseña de BD (ingresa la contraseña o guarda el job primero)' }, { status: 400 });
    }

    let databases: string[] = [];

    switch (engine) {
      case 'postgres':
        databases = await discoverPostgres(body, show_system_databases);
        break;
      case 'mysql':
        databases = await discoverMySQL(body, show_system_databases);
        break;
      case 'mssql':
        databases = await discoverMSSQL(body, show_system_databases);
        break;
      default:
        return NextResponse.json({ error: `Motor no soportado: ${engine}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, databases });
  } catch (error: any) {
    console.error('[Discover Databases] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al descubrir bases de datos',
    }, { status: 500 });
  }
}

// ── PostgreSQL ──
async function discoverPostgres(params: DiscoverRequest, showSystem?: boolean): Promise<string[]> {
  const { host, port, db_username, db_password, use_ssh_tunnel, ssh_host, ssh_port, ssh_username, ssh_password } = params;

  let connectHost = host;
  let connectPort = port || 5432;
  let sshClient: SSHClient | null = null;
  let server: net.Server | null = null;

  try {
    // Si usa túnel SSH, crear el túnel primero
    if (use_ssh_tunnel && ssh_host && ssh_username && ssh_password) {
      const tunnel = await createSSHTunnel(ssh_host, ssh_port || 22, ssh_username, ssh_password, host, port || 5432);
      sshClient = tunnel.sshClient;
      server = tunnel.server;
      connectHost = '127.0.0.1';
      connectPort = tunnel.localPort;
    }

    const pool = new pg.Pool({
      host: connectHost,
      port: connectPort,
      user: db_username,
      password: db_password,
      database: 'postgres', // conectar a la BD por defecto para listar
      connectionTimeoutMillis: 8000,
    });

    const query = showSystem
      ? `SELECT datname FROM pg_database ORDER BY datname`
      : `SELECT datname FROM pg_database WHERE datistemplate = false AND datname NOT IN ('postgres') ORDER BY datname`;

    const result = await pool.query(query);
    await pool.end();

    return result.rows.map((r: any) => r.datname);
  } finally {
    if (server) server.close();
    if (sshClient) sshClient.end();
  }
}

// ── MySQL (vía SSH o directo) ──
async function discoverMySQL(params: DiscoverRequest, showSystem?: boolean): Promise<string[]> {
  const { host, port, db_username, db_password, use_ssh_tunnel, ssh_host, ssh_port, ssh_username, ssh_password } = params;

  let connectHost = host;
  let connectPort = port || 3306;
  let sshClient: SSHClient | null = null;
  let server: net.Server | null = null;

  try {
    if (use_ssh_tunnel && ssh_host && ssh_username && ssh_password) {
      const tunnel = await createSSHTunnel(ssh_host, ssh_port || 22, ssh_username, ssh_password, host, port || 3306);
      sshClient = tunnel.sshClient;
      server = tunnel.server;
      connectHost = '127.0.0.1';
      connectPort = tunnel.localPort;
    }

    // Usar mysql2 dinámicamente si está disponible, o pg como fallback de query
    const mysql2 = await import('mysql2/promise').catch(() => null);
    if (!mysql2) {
      throw new Error('mysql2 no está instalado. Ejecuta: npm install mysql2');
    }

    const conn = await mysql2.createConnection({
      host: connectHost,
      port: connectPort,
      user: db_username,
      password: db_password,
      connectTimeout: 8000,
    });

    const systemDbs = ['information_schema', 'mysql', 'performance_schema', 'sys'];
    const [rows] = await conn.query('SHOW DATABASES');
    await conn.end();

    const allDbs = (rows as any[]).map((r: any) => r.Database || r.database || Object.values(r)[0]) as string[];

    if (showSystem) return allDbs.sort();
    return allDbs.filter(db => !systemDbs.includes(db.toLowerCase())).sort();
  } finally {
    if (server) server.close();
    if (sshClient) sshClient.end();
  }
}

// ── MSSQL ──
async function discoverMSSQL(params: DiscoverRequest, showSystem?: boolean): Promise<string[]> {
  const { host, port, db_username, db_password } = params;

  const config: sql.config = {
    server: host,
    port: port || 1433,
    user: db_username,
    password: db_password,
    domain: '.', // NTLM Windows Authentication
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    connectionTimeout: 8000,
    requestTimeout: 8000,
  };

  const pool = await sql.connect(config);

  const query = showSystem
    ? `SELECT name FROM sys.databases ORDER BY name`
    : `SELECT name FROM sys.databases WHERE database_id > 4 AND name NOT IN ('master', 'tempdb', 'model', 'msdb') ORDER BY name`;

  const result = await pool.request().query(query);
  await pool.close();

  return result.recordset.map((r: any) => r.name);
}

// ── Helper: Crear túnel SSH ──
function createSSHTunnel(
  sshHost: string, sshPort: number, sshUser: string, sshPass: string,
  dbHost: string, dbPort: number
): Promise<{ sshClient: SSHClient; server: net.Server; localPort: number }> {
  return new Promise((resolve, reject) => {
    const sshClient = new SSHClient();
    const timeout = setTimeout(() => {
      sshClient.end();
      reject(new Error('SSH Tunnel: Tiempo de espera agotado (>8s)'));
    }, 8000);

    sshClient.on('ready', () => {
      // Crear servidor TCP local que tuneliza al DB remoto
      const server = net.createServer((sock) => {
        sshClient.forwardOut('127.0.0.1', 0, dbHost, dbPort, (err, stream) => {
          if (err) { sock.end(); return; }
          sock.pipe(stream).pipe(sock);
        });
      });

      server.listen(0, '127.0.0.1', () => {
        clearTimeout(timeout);
        const addr = server.address() as net.AddressInfo;
        resolve({ sshClient, server, localPort: addr.port });
      });
    });

    sshClient.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Error SSH: ${err.message}`));
    });

    sshClient.connect({
      host: sshHost,
      port: sshPort,
      username: sshUser,
      password: sshPass,
      readyTimeout: 8000,
    });
  });
}
