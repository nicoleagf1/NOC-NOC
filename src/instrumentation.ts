/**
 * Next.js Instrumentation Hook
 * =============================
 * Este archivo se ejecuta automáticamente al arrancar el servidor Next.js.
 * Se usa para inicializar servicios de fondo como el Backup Scheduler.
 *
 * Documentación: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Solo ejecutar en el servidor Node.js (no en Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Inicializando servicios de fondo...');

    // Iniciar el programador de respaldos automáticos
    // Se importa dinámicamente para evitar que se cargue en el cliente
    try {
      const { backupSchedulerService } = await import('@/lib/services/backupSchedulerService');

      // Pequeño delay para asegurar que la conexión a DB esté lista
      setTimeout(async () => {
        try {
          await backupSchedulerService.initialize();
        } catch (err: any) {
          console.error('[Instrumentation] Error inicializando backup scheduler:', err.message);
        }
      }, 5000);
    } catch (err: any) {
      console.error('[Instrumentation] Error cargando backupSchedulerService:', err.message);
    }
  }
}
