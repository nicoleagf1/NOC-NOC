/**
 * NOC-NOC Backup Engine Service (Agentless)
 * ===========================================
 * Motor de respaldo que opera sin instalar software en los servidores remotos.
 * Soporta MySQL (vía túnel SSH), Microsoft SQL Server (T-SQL nativo) y PostgreSQL.
 *
 * Flujo por motor:
 *   1. Abre conexión (directa o vía túnel SSH)
 *   2. Ejecuta el dump/backup en streaming
 *   3. Comprime el resultado (gzip) al vuelo
 *   4. Guarda el archivo en el destino (NAS / local / S3)
 *   5. Registra el resultado en backup_history
 *   6. Aplica la política de retención (elimina archivos viejos)
 */

import { Client as SSHClient } from 'ssh2';
import * as mssql from 'mssql';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as zlib from 'zlib';
import { ZipArchive } from 'archiver';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { spawn } from 'child_process';
import { backupJobService } from './backupJobService';
import { decrypt } from '@/lib/security';
import type { BackupJob } from '@/types/backup';

const sevenZip = require('7zip-bin');

async function sevenZipFile(sourceFilePath: string, sevenZipFilePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let binPath = sevenZip.path7za;
    if (!binPath || !fs.existsSync(binPath)) {
      binPath = '7za';
    }
    const p7z = spawn(binPath, ['a', '-t7z', '-mx=6', sevenZipFilePath, sourceFilePath], {
      windowsHide: true,
    });

    let stderr = '';
    p7z.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    p7z.on('close', (code: number) => {
      if (code === 0) {
        try {
          if (fs.existsSync(sourceFilePath) && path.resolve(sourceFilePath) !== path.resolve(sevenZipFilePath)) {
            fs.unlinkSync(sourceFilePath);
          }
        } catch (err) {
          console.warn(`[sevenZipFile] No se pudo borrar archivo temporal: ${sourceFilePath}`, err);
        }
        resolve();
      } else {
        reject(new Error(`7-Zip falló con código ${code}: ${stderr}`));
      }
    });

    p7z.on('error', (err) => reject(err));
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Utilidades
// ──────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function buildFileName(job: BackupJob, ext: string): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // 20260925010000
  const safeName = job.database_name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safeName}_${ts}${ext}`;
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Normaliza una ruta UNC a partes: ['server', 'share', 'sub', ...]
 */
function parseUNCParts(uncPath: string): string[] {
  return uncPath.replace(/\\/g, '/').replace(/^\/+/, '').split('/').filter(Boolean);
}

/**
 * Si el job tiene credenciales NAS, monta el share de red según la plataforma:
 * - Windows: `net use`
 * - Linux:   `mount -t cifs` (requiere cifs-utils instalado en el contenedor)
 */
async function ensureNasAccess(job: BackupJob): Promise<void> {
  if (!job.nas_username || !job.nas_password_encrypted) return;
  const destPath = job.destination_path;
  if (!destPath.startsWith('\\')) return; // Solo aplica a rutas UNC

  const nasPassword = decrypt(job.nas_password_encrypted);
  const isWin = os.platform() === 'win32';
  const parts = parseUNCParts(destPath);
  const server = parts[0];
  const share = parts[1] || '';

  try {
    const { execSync } = await import('child_process');

    if (isWin) {
      const shareRoot = `\\\\${server}\\${share}`;
      try { execSync(`net use "${shareRoot}" /delete /y 2>nul`, { timeout: 10000, windowsHide: true }); } catch { /* ignorar */ }
      execSync(`net use "${shareRoot}" /user:"${job.nas_username}" "${nasPassword}"`, { timeout: 15000, windowsHide: true });
      console.log(`[NAS] Montado con net use: ${shareRoot} (usuario: ${job.nas_username})`);
    } else {
      // Linux: mount -t cifs
      const shareRoot = `//${server}/${share}`;
      const mountPoint = `/mnt/nas_${server}_${share}`.replace(/[^a-zA-Z0-9_/]/g, '_');
      try { fs.mkdirSync(mountPoint, { recursive: true }); } catch { /* ignorar */ }
      try { execSync(`umount "${mountPoint}" 2>/dev/null`, { timeout: 5000 }); } catch { /* ignorar */ }

      let userPart = job.nas_username;
      let domainOpt = '';
      if (job.nas_username.includes('\\')) {
        const idx = job.nas_username.lastIndexOf('\\');
        domainOpt = `,domain=${job.nas_username.substring(0, idx)}`;
        userPart = job.nas_username.substring(idx + 1);
      } else if (job.nas_username.startsWith('./')) {
        userPart = job.nas_username.substring(2);
      }

      execSync(`mount -t cifs "${shareRoot}" "${mountPoint}" -o username="${userPart}",password="${nasPassword}"${domainOpt},iocharset=utf8,file_mode=0777,dir_mode=0777`, { timeout: 15000 });
      console.log(`[NAS] Montado con mount -t cifs: ${shareRoot} → ${mountPoint} (usuario: ${job.nas_username})`);
    }
  } catch (err: any) {
    const errMsg = err.stderr?.toString?.() || err.message || 'Error desconocido';
    console.error(`[NAS] ERROR al montar ruta de red: ${errMsg}`);
    throw new Error(`No se pudo montar la carpeta de red: ${errMsg.trim()}`);
  }
}

/**
 * Resuelve la ruta de destino según la plataforma.
 * En Linux, traduce rutas UNC (\\server\share\sub) a /mnt/nas_server_share/sub.
 */
function resolveDestPath(destPath: string): string {
  if (os.platform() === 'win32') return destPath;
  if (!destPath.startsWith('\\')) return destPath;

  const parts = parseUNCParts(destPath);
  const server = parts[0];
  const share = parts[1] || '';
  const subPath = parts.slice(2).join('/');
  const mountPoint = `/mnt/nas_${server}_${share}`.replace(/[^a-zA-Z0-9_/]/g, '_');
  return subPath ? `${mountPoint}/${subPath}` : mountPoint;
}

async function zipFile(sourceFilePath: string, zipFilePath: string, internalName?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = new ZipArchive({ zlib: { level: 6 } });

    output.on('close', () => {
      // Borrar el archivo original si no es el mismo archivo que el zip
      try {
        if (fs.existsSync(sourceFilePath) && path.resolve(sourceFilePath) !== path.resolve(zipFilePath)) {
          fs.unlinkSync(sourceFilePath);
        }
      } catch (err) {
        console.warn(`[zipFile] No se pudo borrar el archivo temporal: ${sourceFilePath}`, err);
      }
      resolve();
    });

    output.on('error', (err) => reject(err));
    archive.on('error', (err) => reject(err));
    archive.pipe(output);
    archive.file(sourceFilePath, { name: internalName || path.basename(sourceFilePath) });
    archive.finalize().catch(reject);
  });
}

/**
 * Aplica el formato de compresión elegido (zip, gzip o ninguno) a un archivo generado
 */
async function compressAndFinalizeFile(
  rawFilePath: string,
  compressionFormat: string
): Promise<{ filePath: string; sizeBytes: number }> {
  if (!fs.existsSync(rawFilePath)) {
    throw new Error(`El archivo de respaldo no fue generado en: ${rawFilePath}`);
  }

  let finalPath = rawFilePath;

  if (compressionFormat === '7z') {
    const ext = path.extname(rawFilePath);
    const sevenZipPath = rawFilePath.slice(0, -ext.length) + '.7z';
    console.log(`[Backup Engine] Comprimiendo a 7-Zip: ${sevenZipPath}`);
    await sevenZipFile(rawFilePath, sevenZipPath);
    finalPath = sevenZipPath;
  } else if (compressionFormat === 'zip') {
    const ext = path.extname(rawFilePath);
    const zipPath = rawFilePath.slice(0, -ext.length) + '.zip';
    console.log(`[Backup Engine] Comprimiendo a ZIP: ${zipPath}`);
    await zipFile(rawFilePath, zipPath, path.basename(rawFilePath));
    finalPath = zipPath;
  } else if (compressionFormat === 'gzip') {
    if (!rawFilePath.endsWith('.gz')) {
      const gzPath = `${rawFilePath}.gz`;
      console.log(`[Backup Engine] Comprimiendo a GZIP: ${gzPath}`);
      const source = fs.createReadStream(rawFilePath);
      const destination = fs.createWriteStream(gzPath);
      const gzip = zlib.createGzip({ level: 6 });
      await pipeline(source, gzip, destination);
      try {
        if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
      } catch {}
      finalPath = gzPath;
    }
  }

  const stats = fs.statSync(finalPath);
  return { filePath: finalPath, sizeBytes: stats.size };
}

// ──────────────────────────────────────────────────────────────────────────────
// MySQL vía Túnel SSH (Agentless - Sin instalar nada en el servidor remoto)
// ──────────────────────────────────────────────────────────────────────────────

async function backupMySQL(job: BackupJob): Promise<{ filePath: string; sizeBytes: number }> {
  const fileName = buildFileName(job, '.sql');
  const destDir = resolveDestPath(job.destination_path);
  await ensureNasAccess(job);
  ensureDir(destDir);
  const rawFilePath = path.join(destDir, fileName);

  // Descifrar contraseñas almacenadas
  const dbPassword = job.db_password_encrypted ? decrypt(job.db_password_encrypted) : '';

  await new Promise<void>((resolve, reject) => {
    if (job.use_ssh_tunnel && job.ssh_host) {
      // ── Conexión vía Túnel SSH ──
      const sshPassword = job.ssh_password_encrypted ? decrypt(job.ssh_password_encrypted) : '';

      const ssh = new SSHClient();
      ssh.on('ready', () => {
        // Construir comando remoto: si el host no tiene mysqldump instalado, usar el contenedor docker
        // Agregamos "; echo EXIT_CODE:$?" para capturar el código de salida del dump
        const dumpCmd = `
          if command -v mysqldump >/dev/null 2>&1; then
            mysqldump -h ${job.host} -P ${job.port || 3306} -u ${job.db_username} -p'${dbPassword}' --single-transaction --quick --routines --triggers --set-gtid-purged=OFF ${job.database_name} 2>/tmp/mysqldump_stderr.log; DUMP_EXIT=$?; cat /tmp/mysqldump_stderr.log >&2; exit $DUMP_EXIT
          elif command -v mariadb-dump >/dev/null 2>&1; then
            mariadb-dump -h ${job.host} -P ${job.port || 3306} -u ${job.db_username} -p'${dbPassword}' --single-transaction --quick --routines --triggers ${job.database_name} 2>/tmp/mysqldump_stderr.log; DUMP_EXIT=$?; cat /tmp/mysqldump_stderr.log >&2; exit $DUMP_EXIT
          elif docker ps --format '{{.Names}}' 2>/dev/null | grep -Eq '^(mariadb|mysql)$'; then
            CONTAINER=$(docker ps --format '{{.Names}}' | grep -E '^(mariadb|mysql)$' | head -n 1)
            docker exec $CONTAINER sh -c "mariadb-dump -u ${job.db_username} -p'${dbPassword}' --single-transaction --quick --routines --triggers ${job.database_name} 2>/dev/null || mysqldump -u ${job.db_username} -p'${dbPassword}' --single-transaction --quick --routines --triggers ${job.database_name}"
          else
            echo "Error: No se encontró mysqldump ni contenedor mariadb/mysql en el servidor remoto." >&2
            exit 127
          fi
        `;

        ssh.exec(dumpCmd, (err, stream) => {
          if (err) {
            ssh.end();
            return reject(new Error(`Error ejecutando dump remoto: ${err.message}`));
          }

          const fileStream = fs.createWriteStream(rawFilePath);
          let stderrOutput = '';
          let exitCode: number | null = null;

          stream.stderr.on('data', (data: Buffer) => {
            stderrOutput += data.toString();
          });

          // Capturar el código de salida del comando remoto
          stream.on('exit', (code: number) => {
            exitCode = code;
          });

          pipeline(stream, fileStream)
            .then(() => {
              ssh.end();
              const stats = fs.statSync(rawFilePath);

              // Validar código de salida
              if (exitCode !== null && exitCode !== 0) {
                if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
                reject(new Error(`mysqldump falló con código de salida ${exitCode}. stderr: ${stderrOutput}`));
                return;
              }

              // Validar que el archivo no esté vacío
              if (stats.size < 100) {
                fs.unlinkSync(rawFilePath);
                reject(new Error(`mysqldump produjo un archivo vacío (${stats.size} bytes). stderr: ${stderrOutput}`));
                return;
              }

              // Validar integridad: el dump debe terminar con "-- Dump completed"
              try {
                const fd = fs.openSync(rawFilePath, 'r');
                const tailSize = Math.min(stats.size, 512);
                const buffer = Buffer.alloc(tailSize);
                fs.readSync(fd, buffer, 0, tailSize, stats.size - tailSize);
                fs.closeSync(fd);
                const tail = buffer.toString('utf-8');

                if (!tail.includes('Dump completed')) {
                  console.warn(`[Backup Engine] ADVERTENCIA: Dump incompleto detectado para ${job.database_name}. Tamaño: ${formatBytes(stats.size)}. Los últimos 200 caracteres: ${tail.slice(-200)}`);
                  if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
                  reject(new Error(`Dump incompleto: el archivo (${formatBytes(stats.size)}) no contiene el marcador "Dump completed". La conexión SSH pudo haberse interrumpido durante la transferencia. stderr: ${stderrOutput}`));
                  return;
                }
              } catch (readErr) {
                console.warn(`[Backup Engine] No se pudo validar integridad del dump: ${readErr}`);
                // Continuar aunque no se pueda validar
              }

              console.log(`[Backup Engine] Dump MySQL completado: ${formatBytes(stats.size)} para ${job.database_name}`);
              resolve();
            })
            .catch((pipeErr) => {
              ssh.end();
              if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
              reject(new Error(`Error en streaming MySQL: ${pipeErr.message}. stderr: ${stderrOutput}`));
            });
        });
      });

      ssh.on('error', (err) => {
        reject(new Error(`Error de conexión SSH a ${job.ssh_host}: ${err.message}`));
      });

      ssh.connect({
        host: job.ssh_host,
        port: job.ssh_port || 22,
        username: job.ssh_username || 'root',
        password: sshPassword,
        readyTimeout: 60000,
        keepaliveInterval: 10000,  // Enviar keepalive cada 10 segundos
        keepaliveCountMax: 30,     // Tolerar 30 fallos (5 minutos sin respuesta)
      });
    } else {
      // ── Conexión directa TCP/IP ──
      const { exec } = require('child_process');
      const dumpCmd = `mysqldump -h ${job.host} -P ${job.port} -u ${job.db_username} -p"${dbPassword}" --single-transaction --quick --routines --triggers ${job.database_name}`;

      const child = exec(dumpCmd, { maxBuffer: 1024 * 1024 * 1024 });
      const fileStream = fs.createWriteStream(rawFilePath);

      let stderrOutput = '';
      child.stderr?.on('data', (data: string) => {
        stderrOutput += data;
      });

      pipeline(child.stdout!, fileStream)
        .then(() => {
          const stats = fs.statSync(rawFilePath);
          if (stats.size < 100) {
            fs.unlinkSync(rawFilePath);
            reject(new Error(`mysqldump local produjo archivo vacío. stderr: ${stderrOutput}`));
          } else {
            resolve();
          }
        })
        .catch((err: any) => {
          if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
          reject(new Error(`Error en streaming MySQL local: ${err.message}. stderr: ${stderrOutput}`));
        });
    }
  });

  return await compressAndFinalizeFile(rawFilePath, job.compression_format);
}

// ──────────────────────────────────────────────────────────────────────────────
// Microsoft SQL Server (T-SQL nativo con BACKUP DATABASE)
// ──────────────────────────────────────────────────────────────────────────────

async function backupMSSQL(job: BackupJob): Promise<{ filePath: string; sizeBytes: number }> {
  const fileName = buildFileName(job, '.bak');
  const destDir = resolveDestPath(job.destination_path);
  await ensureNasAccess(job);
  ensureDir(destDir);
  const finalFilePath = path.join(destDir, fileName);

  const dbPassword = job.db_password_encrypted ? decrypt(job.db_password_encrypted) : '';

  // Configuración de conexión a SQL Server
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
    requestTimeout: 600000, // 10 minutos para bases grandes
    connectionTimeout: 30000,
  };

  const pool = await mssql.connect(config);

  // Intentar primero directamente a la ruta configurada (por si el servidor SQL tuviera acceso directo al share)
  // Si falla con error de red/ruta, usar el directorio staging en D:\TemporaryFoldelSQL
  const stagingFileName = `noc_${Date.now()}_${fileName}`;
  const stagingSqlPath = `D:\\TemporaryFoldelSQL\\${stagingFileName}`;
  const uncStagingSource = `\\\\${job.host}\\D$\\TemporaryFoldelSQL\\${stagingFileName}`;

  try {
    let backupSuccessfulDirect = false;

    try {
      const directQuery = `
        BACKUP DATABASE [${job.database_name}] 
        TO DISK = N'${finalFilePath.replace(/\\/g, '\\\\')}' 
        WITH FORMAT, 
             CHECKSUM, 
             COMPRESSION, 
             INIT, 
             NAME = N'${job.name} - Full Backup',
             STATS = 10;
      `;
      await pool.request().query(directQuery);
      if (fs.existsSync(finalFilePath)) {
        backupSuccessfulDirect = true;
      }
    } catch (directErr: any) {
      console.warn(`[MSSQL Backup] Intento directo a ${finalFilePath} falló (${directErr.message}). Utilizando staging en ${stagingSqlPath}...`);
    }

    let resultFilePath = finalFilePath;

    if (!backupSuccessfulDirect) {
      // Ejecutar backup en el staging local del servidor SQL
      const stagingQuery = `
        BACKUP DATABASE [${job.database_name}] 
        TO DISK = N'${stagingSqlPath}' 
        WITH FORMAT, 
             CHECKSUM, 
             COMPRESSION, 
             INIT, 
             NAME = N'${job.name} - Staging Backup',
             STATS = 10;
      `;
      await pool.request().query(stagingQuery);

      if (job.compression_format === '7z') {
        const sevenZipPath = finalFilePath.replace(/\.bak$/, '.7z');
        console.log(`[MSSQL Backup] Comprimiendo archivo staging a 7-Zip destino: ${sevenZipPath}`);
        await sevenZipFile(uncStagingSource, sevenZipPath);
        resultFilePath = sevenZipPath;
      } else if (job.compression_format === 'zip') {
        const zipPath = finalFilePath.replace(/\.bak$/, '.zip');
        console.log(`[MSSQL Backup] Comprimiendo archivo staging a ZIP destino: ${zipPath}`);
        await zipFile(uncStagingSource, zipPath, fileName);
        resultFilePath = zipPath;
      } else if (job.compression_format === 'gzip') {
        const gzPath = `${finalFilePath}.gz`;
        console.log(`[MSSQL Backup] Comprimiendo archivo staging a GZIP destino: ${gzPath}`);
        const source = fs.createReadStream(uncStagingSource);
        const destination = fs.createWriteStream(gzPath);
        const gzip = zlib.createGzip({ level: 6 });
        await pipeline(source, gzip, destination);
        resultFilePath = gzPath;
      } else {
        // Sin compresión adicional (.bak)
        await fs.promises.copyFile(uncStagingSource, finalFilePath);
        resultFilePath = finalFilePath;
      }

      // Eliminar el archivo de staging del servidor SQL
      try {
        if (fs.existsSync(uncStagingSource)) {
          fs.unlinkSync(uncStagingSource);
        }
      } catch (cleanErr: any) {
        await pool.request().query(`EXEC xp_cmdshell 'del "${stagingSqlPath}"'`).catch(() => {});
      }
    } else {
      // Se ejecutó directo en destino final: si se pidió compresión, comprimir ahora
      if (job.compression_format === '7z') {
        const sevenZipPath = finalFilePath.replace(/\.bak$/, '.7z');
        console.log(`[MSSQL Backup] Comprimiendo backup a 7-Zip: ${sevenZipPath}`);
        await sevenZipFile(finalFilePath, sevenZipPath);
        resultFilePath = sevenZipPath;
      } else if (job.compression_format === 'zip') {
        const zipPath = finalFilePath.replace(/\.bak$/, '.zip');
        console.log(`[MSSQL Backup] Comprimiendo backup a ZIP: ${zipPath}`);
        await zipFile(finalFilePath, zipPath, fileName);
        resultFilePath = zipPath;
      } else if (job.compression_format === 'gzip') {
        const gzPath = `${finalFilePath}.gz`;
        console.log(`[MSSQL Backup] Comprimiendo backup a GZIP: ${gzPath}`);
        const source = fs.createReadStream(finalFilePath);
        const destination = fs.createWriteStream(gzPath);
        const gzip = zlib.createGzip({ level: 6 });
        await pipeline(source, gzip, destination);
        try {
          if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
        } catch (cleanErr) {}
        resultFilePath = gzPath;
      }
    }

    if (!fs.existsSync(resultFilePath)) {
      throw new Error(`El archivo de backup no fue generado en: ${resultFilePath}`);
    }

    const stats = fs.statSync(resultFilePath);
    return { filePath: resultFilePath, sizeBytes: stats.size };
  } finally {
    await pool.close();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PostgreSQL (pg_dump vía SSH o local)
// ──────────────────────────────────────────────────────────────────────────────

async function backupPostgres(job: BackupJob): Promise<{ filePath: string; sizeBytes: number }> {
  const fileName = buildFileName(job, '.sql');
  const destDir = resolveDestPath(job.destination_path);
  await ensureNasAccess(job);
  ensureDir(destDir);
  const rawFilePath = path.join(destDir, fileName);

  const dbPassword = job.db_password_encrypted ? decrypt(job.db_password_encrypted) : '';

  if (job.use_ssh_tunnel && job.ssh_host) {
    // ── Conexión vía Túnel SSH (usa pg_dump remoto) ──
    await new Promise<void>((resolve, reject) => {
      const sshPassword = job.ssh_password_encrypted ? decrypt(job.ssh_password_encrypted) : '';
      const ssh = new SSHClient();
      ssh.on('ready', () => {
        const dumpCmd = `PGPASSWORD='${dbPassword}' pg_dump -h ${job.host} -p ${job.port} -U ${job.db_username} -F plain ${job.database_name}`;
        ssh.exec(dumpCmd, (err, stream) => {
          if (err) { ssh.end(); return reject(new Error(`Error pg_dump remoto: ${err.message}`)); }
          const fileStream = fs.createWriteStream(rawFilePath);
          let stderrOutput = '';
          stream.stderr.on('data', (data: Buffer) => { stderrOutput += data.toString(); });
          pipeline(stream, fileStream)
            .then(() => {
              ssh.end();
              const stats = fs.statSync(rawFilePath);
              if (stats.size < 100) { fs.unlinkSync(rawFilePath); reject(new Error(`pg_dump vacío. stderr: ${stderrOutput}`)); }
              else { resolve(); }
            })
            .catch((e) => { ssh.end(); if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath); reject(e); });
        });
      });
      ssh.on('error', (err) => reject(new Error(`Error SSH: ${err.message}`)));
      ssh.connect({ host: job.ssh_host, port: job.ssh_port || 22, username: job.ssh_username || 'root', password: sshPassword, readyTimeout: 30000 });
    });

    return await compressAndFinalizeFile(rawFilePath, job.compression_format);
  }

  // ── Conexión directa (librería pg - sin pg_dump instalado) ──
  const pgLib = require('pg');
  const dbPool = new pgLib.Pool({
    host: job.host, port: job.port || 5432,
    user: job.db_username, password: dbPassword,
    database: job.database_name, connectionTimeoutMillis: 30000,
  });

  try {
    const client = await dbPool.connect();
    const fileStream = fs.createWriteStream(rawFilePath);
    const write = (t: string) => fileStream.write(t);

    write(`-- NOC-NOC PostgreSQL Backup\n-- Database: ${job.database_name}\n-- Host: ${job.host}:${job.port}\n-- Date: ${new Date().toISOString()}\n\n`);
    write(`SET statement_timeout = 0;\nSET lock_timeout = 0;\nSET client_encoding = 'UTF8';\nSET standard_conforming_strings = on;\n\n`);

    const tablesRes = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);

    for (const row of tablesRes.rows) {
      const table = row.tablename;
      const colsRes = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale
         FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`, [table]
      );

      write(`\n-- Table: ${table}\nDROP TABLE IF EXISTS "${table}" CASCADE;\nCREATE TABLE "${table}" (\n`);
      const colDefs = colsRes.rows.map((col: any) => {
        let tp = col.data_type;
        if (col.character_maximum_length) tp += `(${col.character_maximum_length})`;
        else if (col.data_type === 'numeric' && col.numeric_precision) tp += `(${col.numeric_precision},${col.numeric_scale || 0})`;
        let l = `  "${col.column_name}" ${tp}`;
        if (col.column_default) l += ` DEFAULT ${col.column_default}`;
        if (col.is_nullable === 'NO') l += ` NOT NULL`;
        return l;
      });
      write(colDefs.join(',\n'));

      const pkRes = await client.query(
        `SELECT kcu.column_name FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY' ORDER BY kcu.ordinal_position`, [table]
      );
      if (pkRes.rows.length > 0) write(`,\n  PRIMARY KEY (${pkRes.rows.map((r: any) => `"${r.column_name}"`).join(', ')})`);
      write(`\n);\n\n`);

      const countRes = await client.query(`SELECT COUNT(*) as cnt FROM "${table}"`);
      if (parseInt(countRes.rows[0].cnt) > 0) {
        const dataRes = await client.query(`SELECT * FROM "${table}"`);
        const columns = dataRes.fields.map((f: any) => `"${f.name}"`).join(', ');
        for (const dr of dataRes.rows) {
          const vals = dataRes.fields.map((f: any) => {
            const v = dr[f.name];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'boolean') return v ? 'true' : 'false';
            if (typeof v === 'number') return String(v);
            if (v instanceof Date) return `'${v.toISOString()}'`;
            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          write(`INSERT INTO "${table}" (${columns}) VALUES (${vals.join(', ')});\n`);
        }
        write(`\n`);
      }
    }

    const seqRes = await client.query(`SELECT sequencename, last_value FROM pg_sequences WHERE schemaname = 'public'`);
    if (seqRes.rows.length > 0) {
      write(`\n-- Sequences\n`);
      for (const s of seqRes.rows) { if (s.last_value) write(`SELECT setval('"${s.sequencename}"', ${s.last_value}, true);\n`); }
    }
    write(`\n-- Backup completed: ${new Date().toISOString()}\n`);

    client.release();
    await dbPool.end();

    await new Promise<void>((res, rej) => {
      fileStream.end(() => res());
      fileStream.on('error', rej);
    });

    const stats = fs.statSync(rawFilePath);
    if (stats.size < 50) { fs.unlinkSync(rawFilePath); throw new Error('Dump PostgreSQL vacío.'); }
    return await compressAndFinalizeFile(rawFilePath, job.compression_format);
  } catch (err) {
    await dbPool.end().catch(() => {});
    if (fs.existsSync(rawFilePath)) fs.unlinkSync(rawFilePath);
    throw err;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Política de Retención (Housekeeping)
// ──────────────────────────────────────────────────────────────────────────────

async function applyRetentionPolicy(job: BackupJob): Promise<{ deletedCount: number; purgedFiles: string[] }> {
  const destDir = resolveDestPath(job.destination_path);
  if (!fs.existsSync(destDir)) {
    console.warn(`[Retención] Carpeta de destino no existe o no es accesible: ${destDir}`);
    return { deletedCount: 0, purgedFiles: [] };
  }

  // Validación de seguridad: debe ser un número entero mayor a 0
  if (!job.retention_days || job.retention_days < 1) {
    console.log(`[Retención] Política inactiva o días inválidos para "${job.name}" (${job.retention_days} días)`);
    return { deletedCount: 0, purgedFiles: [] };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - job.retention_days);

  // Nombre de la base de datos normalizado para NO borrar respaldos de otras BD en la misma carpeta compartida
  const safeDbPrefix = job.database_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const validExtensions = ['.bak', '.gz', '.zip', '.7z', '.sql'];

  const purgedFiles: string[] = [];

  try {
    const files = fs.readdirSync(destDir);
    for (const file of files) {
      const fileLower = file.toLowerCase();

      // 1. Debe tener una extensión de respaldo conocida
      const hasValidExt = validExtensions.some((ext) => fileLower.endsWith(ext));
      if (!hasValidExt) continue;

      // 2. Debe pertenecer a esta base de datos (evita borrar archivos de otras BD como AVEPAG o NVEPAG)
      const fileWithoutSymbols = fileLower.replace(/[^a-zA-Z0-9]/g, '');
      if (!fileWithoutSymbols.startsWith(safeDbPrefix)) continue;

      const fullPath = path.join(destDir, file);
      const stat = fs.statSync(fullPath);

      // 3. Solo purgar si su fecha de modificación es anterior a la fecha de corte
      if (stat.isFile() && stat.mtime < cutoffDate) {
        fs.unlinkSync(fullPath);
        purgedFiles.push(file);
        console.log(`[Retención] 🗑 Archivo purgado (> ${job.retention_days}d): ${file} (mtime: ${stat.mtime.toLocaleDateString()})`);
      }
    }
  } catch (err: any) {
    console.error(`[Retención] Error limpiando archivos en ${destDir}: ${err.message}`);
  }

  return { deletedCount: purgedFiles.length, purgedFiles };
}

// ──────────────────────────────────────────────────────────────────────────────
// Orquestador Principal (Punto de entrada para ejecutar un Job)
// ──────────────────────────────────────────────────────────────────────────────

export const backupEngineService = {
  /**
   * Ejecuta un trabajo de respaldo completo:
   * 1. Registra inicio en backup_history (status = RUNNING)
   * 2. Ejecuta el dump según el motor (mysql, mssql, postgres)
   * 3. Aplica política de retención para depurar archivos antiguos
   * 4. Actualiza backup_history con resultado (SUCCESS o FAILED)
   */
  async runJob(jobId: string): Promise<{
    success: boolean;
    historyId: string;
    filePath?: string;
    sizeFormatted?: string;
    durationSeconds?: number;
    error?: string;
  }> {
    // 1. Obtener la configuración del Job
    const job = await backupJobService.getJobById(jobId);
    if (!job) {
      throw new Error(`Job no encontrado: ${jobId}`);
    }

    if (!job.is_active) {
      throw new Error(`Job "${job.name}" está desactivado.`);
    }

    // 2. Registrar inicio en el historial
    const historyId = await backupJobService.createHistoryRecord(jobId, 'FULL');
    const startTime = Date.now();

    console.log(`[Backup Engine] ▶ Iniciando: "${job.name}" (${job.engine}) → ${job.destination_path}`);

    try {
      // 3. Ejecutar el respaldo según el motor
      let result: { filePath: string; sizeBytes: number };

      switch (job.engine) {
        case 'mysql':
          result = await backupMySQL(job);
          break;
        case 'mssql':
          result = await backupMSSQL(job);
          break;
        case 'postgres':
          result = await backupPostgres(job);
          break;
        default:
          throw new Error(`Motor de base de datos no soportado: ${job.engine}`);
      }

      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const sizeFormatted = formatBytes(result.sizeBytes);

      // 4. Aplicar política de retención
      const retentionResult = await applyRetentionPolicy(job);
      let retentionSummary = '';
      if (retentionResult.deletedCount > 0) {
        retentionSummary = ` | Retención: ${retentionResult.deletedCount} archivo(s) depurado(s) (> ${job.retention_days}d: ${retentionResult.purgedFiles.join(', ')})`;
        console.log(`[Backup Engine] 🗑 Retención: ${retentionResult.deletedCount} archivo(s) depurado(s) (> ${job.retention_days} días)`);
      } else {
        retentionSummary = ` | Retención: Verificada (${job.retention_days} días), 0 archivos expirados`;
      }

      // 5. Registrar éxito en el historial
      await backupJobService.updateHistoryRecord(historyId, {
        status: 'SUCCESS',
        durationSeconds,
        fileName: path.basename(result.filePath),
        fileSizeBytes: result.sizeBytes,
        fileSizeFormatted: sizeFormatted,
        destinationSavedPath: result.filePath,
        logOutput: `Backup completado exitosamente. Motor: ${job.engine}, Tamaño: ${sizeFormatted}, Duración: ${durationSeconds}s${retentionSummary}`,
      });

      console.log(`[Backup Engine] ✓ Completado: "${job.name}" → ${sizeFormatted} en ${durationSeconds}s`);

      return {
        success: true,
        historyId,
        filePath: result.filePath,
        sizeFormatted,
        durationSeconds,
      };
    } catch (error: any) {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      // Extraer causa raíz detallada (incluyendo errores anidados de MSSQL, SSH o MySQL)
      let detailedError = error.message || 'Error desconocido';
      if (error.precedingErrors && Array.isArray(error.precedingErrors) && error.precedingErrors.length > 0) {
        const precedingMsgs = error.precedingErrors.map((pe: any) => pe.message || pe).join('\n• ');
        detailedError = `${detailedError}\n\nDetalles del motor:\n• ${precedingMsgs}`;
      }
      if (error.originalError?.message && error.originalError.message !== error.message) {
        detailedError = `${detailedError}\n\nCausa original:\n• ${error.originalError.message}`;
      }

      const logOutput = [
        `=== REPORTE DE ERROR DE RESPALDO ===`,
        `Trabajo: ${job.name} (ID: ${job.id})`,
        `Motor: ${job.engine}`,
        `Servidor: ${job.host}:${job.port}`,
        `Base de Datos: ${job.database_name}`,
        `Ruta Destino: ${job.destination_path}`,
        `Túnel SSH: ${job.use_ssh_tunnel ? `Activo (${job.ssh_host}:${job.ssh_port})` : 'No'}`,
        `Fecha de Intento: ${new Date().toISOString()}`,
        `Duración antes del fallo: ${durationSeconds} segundos`,
        ``,
        `--- MENSAJE DE ERROR ---`,
        detailedError,
        ``,
        `--- DETALLES TÉCNICOS ---`,
        `Código de Error: ${error.code || error.number || 'N/A'}`,
        `Estado SQL: ${error.state || 'N/A'}`,
        `Clase / Severidad: ${error.class || error.severity || 'N/A'}`,
        `Procedimiento: ${error.procName || 'N/A'}`,
        `Línea: ${error.lineNumber || 'N/A'}`,
        ``,
        `--- STACK TRACE ---`,
        error.stack || 'No disponible',
      ].join('\n');

      // Registrar fallo en el historial
      await backupJobService.updateHistoryRecord(historyId, {
        status: 'FAILED',
        durationSeconds,
        errorMessage: detailedError,
        logOutput,
      });

      console.error(`[Backup Engine] ✗ Fallo en "${job.name}":\n${detailedError}`);

      return {
        success: false,
        historyId,
        durationSeconds,
        error: detailedError,
      };
    }
  },

  /**
   * Ejecuta todos los trabajos activos (para uso del scheduler)
   */
  async runAllActiveJobs(): Promise<void> {
    const jobs = await backupJobService.getAllJobs();
    const activeJobs = jobs.filter(j => j.is_active);

    console.log(`[Backup Engine] Ejecutando ${activeJobs.length} trabajo(s) activo(s)...`);

    for (const job of activeJobs) {
      try {
        await this.runJob(job.id);
      } catch (err: any) {
        console.error(`[Backup Engine] Error crítico en job "${job.name}": ${err.message}`);
      }
    }
  },
};
