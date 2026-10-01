import { NextResponse } from 'next/server';
import { backupEngineService } from '@/lib/services/backupEngineService';
import { query } from '@/lib/db';

/**
 * POST /api/backups/jobs/[id]/cancel
 * Cancela un trabajo de respaldo en ejecución.
 * Si el proceso ya no existe (ej: reinicio de servidor), marca los registros
 * huérfanos RUNNING como FAILED.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID de trabajo requerido' }, { status: 400 });
    }

    // Intentar cancelar el proceso activo
    const cancelled = backupEngineService.cancelJob(id);

    if (cancelled) {
      return NextResponse.json({ message: `Backup "${id}" cancelado` });
    }

    // Si no hay proceso activo, limpiar registros huérfanos RUNNING en la BD
    // (ocurre cuando el servidor se reinició mientras un backup corría)
    const orphaned = await query(
      `UPDATE backup_history 
       SET status = 'FAILED', 
           error_message = 'Cancelado manualmente. El proceso original ya no estaba activo (posible reinicio del servidor).',
           finished_at = CURRENT_TIMESTAMP,
           duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::integer
       WHERE job_id = $1 AND status = 'RUNNING'
       RETURNING id`,
      [id]
    );

    if (orphaned.rowCount && orphaned.rowCount > 0) {
      return NextResponse.json({ 
        message: `Se marcaron ${orphaned.rowCount} registro(s) huérfano(s) como cancelado(s)` 
      });
    }

    return NextResponse.json({ error: 'No hay backup en ejecución para este trabajo' }, { status: 404 });
  } catch (error: any) {
    console.error('Error cancelando backup:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
