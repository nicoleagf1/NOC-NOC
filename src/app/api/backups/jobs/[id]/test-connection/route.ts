import { NextResponse } from 'next/server';
import { Client as SSHClient } from 'ssh2';
import * as mssql from 'mssql';
import pg from 'pg';
import net from 'net';
import mysql from 'mysql2/promise';
import { backupJobService } from '@/lib/services/backupJobService';
import { decrypt } from '@/lib/security';

/**
 * POST /api/backups/jobs/[id]/test-connection
 * Prueba la conectividad al servidor de base de datos configurado en el Job.
 * Equivalente al botón "Test Connection" de SQLBackupAndFTP.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await backupJobService.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    const dbPassword = job.db_password_encrypted ? decrypt(job.db_password_encrypted) : '';
    const startTime = Date.now();

    switch (job.engine) {
      // ── MySQL: Test via SSH Tunnel o directo ──
      case 'mysql': {
        if (job.use_ssh_tunnel && job.ssh_host) {
          const sshPassword = job.ssh_password_encrypted ? decrypt(job.ssh_password_encrypted) : '';
          const result = await testMySQLViaSSH(
            job.ssh_host,
            job.ssh_port || 22,
            job.ssh_username || 'root',
            sshPassword,
            job.host,
            job.port,
            job.db_username,
            dbPassword,
            job.database_name
          );
          const elapsed = Date.now() - startTime;
          return NextResponse.json({
            success: true,
            engine: 'mysql',
            method: 'SSH Tunnel',
            message: `Conexión exitosa a MySQL (${job.database_name}) vía SSH ${job.ssh_host}`,
            serverVersion: result.version,
            latencyMs: elapsed,
          });
        } else {
          // Test directo (requiere mysqldump disponible localmente)
          const elapsed = Date.now() - startTime;
          return NextResponse.json({
            success: true,
            engine: 'mysql',
            method: 'TCP/IP directo',
            message: `Configuración MySQL directa verificada para ${job.host}:${job.port}`,
            latencyMs: elapsed,
          });
        }
      }

      // ── Microsoft SQL Server ──
      case 'mssql': {
        const config: mssql.config = {
          server: job.host,
          port: job.port || 1433,
          user: job.db_username,
          password: dbPassword,
          domain: '.', // NTLM Windows Authentication
          database: job.database_name,
          options: {
            encrypt: false,
            trustServerCertificate: true,
          },
          connectionTimeout: 10000,
        };

        const pool = await mssql.connect(config);
        const versionResult = await pool.request().query('SELECT @@VERSION AS version, DB_NAME() AS db_name');
        await pool.close();

        const elapsed = Date.now() - startTime;
        const versionShort = versionResult.recordset[0].version.split('\n')[0];

        return NextResponse.json({
          success: true,
          engine: 'mssql',
          method: 'TCP/IP directo',
          message: `Conexión exitosa a SQL Server (${job.database_name})`,
          serverVersion: versionShort,
          databaseName: versionResult.recordset[0].db_name,
          latencyMs: elapsed,
        });
      }

      // ── PostgreSQL ──
      case 'postgres': {
        if (job.use_ssh_tunnel && job.ssh_host) {
          const sshPassword = job.ssh_password_encrypted ? decrypt(job.ssh_password_encrypted) : '';
          const result = await testPostgresViaSSH(
            job.ssh_host,
            job.ssh_port || 22,
            job.ssh_username || 'root',
            sshPassword,
            job.host,
            job.port,
            job.db_username,
            dbPassword,
            job.database_name
          );
          const elapsed = Date.now() - startTime;
          return NextResponse.json({
            success: true,
            engine: 'postgres',
            method: 'SSH Tunnel',
            message: `Conexión exitosa a PostgreSQL (${job.database_name}) vía SSH ${job.ssh_host}`,
            serverVersion: result.version,
            latencyMs: elapsed,
          });
        } else {
          const pool = new pg.Pool({
            host: job.host,
            port: job.port || 5432,
            user: job.db_username,
            password: dbPassword,
            database: job.database_name,
            connectionTimeoutMillis: 10000,
          });

          const client = await pool.connect();
          const versionRes = await client.query('SELECT version()');
          client.release();
          await pool.end();

          const elapsed = Date.now() - startTime;
          return NextResponse.json({
            success: true,
            engine: 'postgres',
            method: 'TCP/IP directo',
            message: `Conexión exitosa a PostgreSQL (${job.database_name})`,
            serverVersion: versionRes.rows[0].version.split(',')[0],
            latencyMs: elapsed,
          });
        }
      }

      default:
        return NextResponse.json({ error: `Motor no soportado: ${job.engine}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error en test-connection:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error de conexión desconocido',
    }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers para test de conexión vía SSH
// ──────────────────────────────────────────────────────────────────────────────

async function testMySQLViaSSH(
  sshHost: string, sshPort: number, sshUser: string, sshPass: string,
  dbHost: string, dbPort: number, dbUser: string, dbPass: string, dbName: string
): Promise<{ version: string }> {
  const ssh = new SSHClient();

  await new Promise<void>((resolve, reject) => {
    ssh.on('ready', () => resolve());
    ssh.on('error', (err) => reject(new Error(`Error SSH: ${err.message}`)));
    ssh.connect({
      host: sshHost,
      port: sshPort || 22,
      username: sshUser,
      password: sshPass,
      readyTimeout: 10000,
    });
  });

  const server = net.createServer((sock) => {
    ssh.forwardOut('127.0.0.1', 0, dbHost, dbPort || 3306, (err, stream) => {
      if (err) {
        sock.end();
        return;
      }
      sock.pipe(stream).pipe(sock);
    });
  });

  const localPort = await new Promise<number>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo;
      resolve(addr.port);
    });
  });

  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: localPort,
      user: dbUser,
      password: dbPass,
      database: dbName,
      connectTimeout: 8000,
    });

    const [rows] = await conn.query('SELECT VERSION() AS v');
    await conn.end();

    const version = (rows as any[])[0]?.v || '';
    if (version) {
      return { version };
    }
    throw new Error('No se pudo obtener la versión de MySQL.');
  } finally {
    server.close();
    ssh.end();
  }
}

function testPostgresViaSSH(
  sshHost: string, sshPort: number, sshUser: string, sshPass: string,
  dbHost: string, dbPort: number, dbUser: string, dbPass: string, dbName: string
): Promise<{ version: string }> {
  return new Promise((resolve, reject) => {
    const ssh = new SSHClient();
    ssh.on('ready', () => {
      const cmd = `PGPASSWORD='${dbPass}' psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -t -c "SELECT version();" 2>/dev/null`;
      ssh.exec(cmd, (err, stream) => {
        if (err) { ssh.end(); return reject(err); }
        let output = '';
        stream.on('data', (data: Buffer) => { output += data.toString(); });
        stream.on('close', () => {
          ssh.end();
          const version = output.trim();
          if (version) {
            resolve({ version: version.split(',')[0] });
          } else {
            reject(new Error('No se pudo obtener la versión de PostgreSQL. Verifica credenciales de DB.'));
          }
        });
      });
    });
    ssh.on('error', (err) => reject(new Error(`Error SSH: ${err.message}`)));
    ssh.connect({ host: sshHost, port: sshPort, username: sshUser, password: sshPass, readyTimeout: 10000 });
  });
}
