import { NextResponse } from 'next/server';
import { backupJobService } from '@/lib/services/backupJobService';
import { encrypt } from '@/lib/security';

/**
 * GET /api/backups/jobs
 * Obtiene todos los trabajos con el estado de su última ejecución
 */
export async function GET() {
  try {
    const jobs = await backupJobService.getAllJobs();
    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error fetching backup jobs:', error);
    return NextResponse.json({ error: 'Error al consultar trabajos de respaldo' }, { status: 500 });
  }
}

/**
 * POST /api/backups/jobs
 * Crea un nuevo trabajo de respaldo
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      engine,
      host,
      port,
      database_name,
      db_username,
      db_password,
      use_ssh_tunnel,
      ssh_host,
      ssh_port,
      ssh_username,
      ssh_password,
      destination_type,
      destination_path,
      cron_schedule,
      schedule_description,
      retention_days,
      compression_format,
      send_alert_on_failure,
      notification_email,
    } = body;

    if (!name || !engine || !database_name || !db_username) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, engine, database_name, db_username' },
        { status: 400 }
      );
    }

    // Cifrar contraseñas antes de almacenar
    const encryptedDbPass = db_password ? encrypt(db_password) : null;
    const encryptedSshPass = ssh_password ? encrypt(ssh_password) : null;

    const sql = `
      INSERT INTO backup_jobs (
        name, engine, host, port, database_name, db_username, db_password_encrypted,
        use_ssh_tunnel, ssh_host, ssh_port, ssh_username, ssh_password_encrypted,
        destination_type, destination_path, cron_schedule, schedule_description,
        retention_days, compression_format, send_alert_on_failure, notification_email
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20
      )
      RETURNING *;
    `;

    const { query } = await import('@/lib/db');
    const res = await query(sql, [
      name,
      engine,
      host || '127.0.0.1',
      port || (engine === 'mssql' ? 1433 : engine === 'mysql' ? 3306 : 5432),
      database_name,
      db_username,
      encryptedDbPass,
      use_ssh_tunnel || false,
      ssh_host || null,
      ssh_port || 22,
      ssh_username || null,
      encryptedSshPass,
      destination_type || 'nas',
      destination_path || '\\\\192.168.0.27\\SqlResBackupAllDB',
      cron_schedule || '0 1 * * *',
      schedule_description || 'Diario a la 01:00 AM (cada 24h)',
      retention_days || 30,
      compression_format || 'zip',
      send_alert_on_failure !== false,
      notification_email || null,
    ]);

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creando backup job:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un trabajo con ese nombre' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
