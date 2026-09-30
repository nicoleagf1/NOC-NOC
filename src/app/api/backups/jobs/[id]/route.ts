import { NextResponse } from 'next/server';
import { backupJobService } from '@/lib/services/backupJobService';
import { query } from '@/lib/db';
import { encrypt, isMasked } from '@/lib/security';

/**
 * GET /api/backups/jobs/[id]
 * Obtiene un trabajo específico por su ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await backupJobService.getJobById(id);

    if (!job) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error obteniendo backup job:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/backups/jobs/[id]
 * Actualiza un trabajo de respaldo existente
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el job existe
    const existing = await backupJobService.getJobById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    const {
      name,
      engine,
      is_active,
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
      nas_username,
      nas_password,
      cron_schedule,
      schedule_description,
      retention_days,
      compression_format,
      send_alert_on_failure,
      notification_email,
    } = body;

    // Solo cifrar contraseñas si se envió un valor nuevo (no la máscara)
    const encryptedDbPass = db_password && !isMasked(db_password)
      ? encrypt(db_password)
      : existing.db_password_encrypted;

    const encryptedSshPass = ssh_password && !isMasked(ssh_password)
      ? encrypt(ssh_password)
      : existing.ssh_password_encrypted;

    const encryptedNasPass = nas_password && !isMasked(nas_password)
      ? encrypt(nas_password)
      : existing.nas_password_encrypted;

    const sql = `
      UPDATE backup_jobs SET
        name = COALESCE($1, name),
        engine = COALESCE($2, engine),
        is_active = COALESCE($3, is_active),
        host = COALESCE($4, host),
        port = COALESCE($5, port),
        database_name = COALESCE($6, database_name),
        db_username = COALESCE($7, db_username),
        db_password_encrypted = COALESCE($8, db_password_encrypted),
        use_ssh_tunnel = COALESCE($9, use_ssh_tunnel),
        ssh_host = $10,
        ssh_port = COALESCE($11, ssh_port),
        ssh_username = $12,
        ssh_password_encrypted = $13,
        destination_type = COALESCE($14, destination_type),
        destination_path = COALESCE($15, destination_path),
        nas_username = $16,
        nas_password_encrypted = $17,
        cron_schedule = COALESCE($18, cron_schedule),
        schedule_description = COALESCE($19, schedule_description),
        retention_days = COALESCE($20, retention_days),
        compression_format = COALESCE($21, compression_format),
        send_alert_on_failure = COALESCE($22, send_alert_on_failure),
        notification_email = $23,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $24
      RETURNING *;
    `;

    const res = await query(sql, [
      name ?? null,
      engine ?? null,
      is_active ?? null,
      host ?? null,
      port ?? null,
      database_name ?? null,
      db_username ?? null,
      encryptedDbPass,
      use_ssh_tunnel ?? null,
      ssh_host ?? null,
      ssh_port ?? null,
      ssh_username ?? null,
      encryptedSshPass,
      destination_type ?? null,
      destination_path ?? null,
      nas_username ?? null,
      encryptedNasPass,
      cron_schedule ?? null,
      schedule_description ?? null,
      retention_days ?? null,
      compression_format ?? null,
      send_alert_on_failure ?? null,
      notification_email ?? null,
      id,
    ]);

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Error actualizando backup job:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un trabajo con ese nombre' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/backups/jobs/[id]
 * Elimina un trabajo de respaldo y todo su historial (CASCADE)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que existe
    const existing = await backupJobService.getJobById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    await query('DELETE FROM backup_jobs WHERE id = $1', [id]);

    return NextResponse.json({
      message: `Trabajo "${existing.name}" eliminado exitosamente`,
      deletedId: id,
    });
  } catch (error: any) {
    console.error('Error eliminando backup job:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
