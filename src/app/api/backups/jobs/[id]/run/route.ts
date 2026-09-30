import { NextResponse } from 'next/server';
import { backupEngineService } from '@/lib/services/backupEngineService';

/**
 * POST /api/backups/jobs/[id]/run
 * Ejecuta un trabajo de respaldo de forma manual ("Run Now")
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

    // Ejecutar el backup en segundo plano y devolver la respuesta inmediatamente
    // Para backups grandes, esto puede tardar minutos
    const result = await backupEngineService.runJob(id);

    if (result.success) {
      return NextResponse.json({
        message: `Backup "${id}" completado exitosamente`,
        historyId: result.historyId,
        filePath: result.filePath,
        size: result.sizeFormatted,
        durationSeconds: result.durationSeconds,
      });
    } else {
      return NextResponse.json({
        error: `Backup falló: ${result.error}`,
        historyId: result.historyId,
        durationSeconds: result.durationSeconds,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error ejecutando backup:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
