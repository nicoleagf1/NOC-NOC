import { NextResponse } from 'next/server';
import { backupEngineService } from '@/lib/services/backupEngineService';

/**
 * POST /api/backups/jobs/[id]/cancel
 * Cancela un trabajo de respaldo en ejecución
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

    const cancelled = backupEngineService.cancelJob(id);

    if (cancelled) {
      return NextResponse.json({ message: `Backup "${id}" cancelado` });
    } else {
      return NextResponse.json({ error: 'No hay backup en ejecución para este trabajo' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error cancelando backup:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
