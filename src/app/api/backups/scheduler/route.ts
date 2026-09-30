import { NextResponse } from 'next/server';
import { backupSchedulerService } from '@/lib/services/backupSchedulerService';

/**
 * GET /api/backups/scheduler
 * Obtiene el estado actual del scheduler (para debugging/monitoreo)
 */
export async function GET() {
  try {
    const status = backupSchedulerService.getStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/backups/scheduler
 * Controla el scheduler: { action: "start" | "reload" | "stop" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        await backupSchedulerService.initialize();
        return NextResponse.json({
          message: 'Scheduler iniciado',
          status: backupSchedulerService.getStatus(),
        });

      case 'reload':
        await backupSchedulerService.reloadAll();
        return NextResponse.json({
          message: 'Scheduler recargado',
          status: backupSchedulerService.getStatus(),
        });

      case 'stop':
        backupSchedulerService.shutdown();
        return NextResponse.json({
          message: 'Scheduler detenido',
          status: backupSchedulerService.getStatus(),
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida. Usa: start, reload, stop' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
