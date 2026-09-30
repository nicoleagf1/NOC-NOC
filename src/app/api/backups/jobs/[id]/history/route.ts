import { NextResponse } from 'next/server';
import { backupJobService } from '@/lib/services/backupJobService';

/**
 * GET /api/backups/jobs/[id]/history
 * Obtiene el historial de ejecuciones de un trabajo de respaldo
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID de trabajo requerido' }, { status: 400 });
    }

    // Obtener los parámetros de query (limit)
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);

    const history = await backupJobService.getHistoryByJobId(id, limit);

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error obteniendo historial de backup:', error);
    return NextResponse.json({ error: 'Error al consultar historial' }, { status: 500 });
  }
}
