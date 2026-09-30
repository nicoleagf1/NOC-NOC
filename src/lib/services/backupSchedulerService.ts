/**
 * NOC-NOC Backup Scheduler Service
 * ==================================
 * Programador automático de respaldos usando node-cron.
 * Lee las expresiones cron de backup_jobs y programa las ejecuciones.
 * 
 * Patrón Singleton: Se inicializa una vez al arrancar la app y se
 * recarga cuando se crean, editan o eliminan trabajos.
 */

import cron, { ScheduledTask } from 'node-cron';
import { backupJobService } from './backupJobService';
import { backupEngineService } from './backupEngineService';
import { backupAlertService } from './backupAlertService';

// Mapa global de tareas programadas: jobId → ScheduledTask
const scheduledTasks = new Map<string, ScheduledTask>();

// Flag para evitar inicializaciones múltiples
let isInitialized = false;

export const backupSchedulerService = {
  /**
   * Inicializa el scheduler leyendo todos los jobs activos de la DB
   * y programando sus ejecuciones según su expresión cron.
   * Se llama una vez al arrancar el servidor.
   */
  async initialize(): Promise<void> {
    if (isInitialized) {
      console.log('[Backup Scheduler] Ya inicializado, saltando...');
      return;
    }

    console.log('[Backup Scheduler] ═══════════════════════════════════════');
    console.log('[Backup Scheduler] Inicializando programador de respaldos');

    try {
      const jobs = await backupJobService.getAllJobs();
      const activeJobs = jobs.filter(j => j.is_active);

      console.log(`[Backup Scheduler] ${activeJobs.length} trabajos activos de ${jobs.length} total`);

      for (const job of activeJobs) {
        this.scheduleJob(job.id, job.name, job.cron_schedule);
      }

      isInitialized = true;
      console.log('[Backup Scheduler] ✓ Programador listo');
      console.log('[Backup Scheduler] ═══════════════════════════════════════');
    } catch (error: any) {
      console.error('[Backup Scheduler] ✗ Error al inicializar:', error.message);
    }
  },

  /**
   * Programa un job individual con su expresión cron
   */
  scheduleJob(jobId: string, jobName: string, cronExpression: string): void {
    // Cancelar la tarea anterior si existía (para re-programación)
    if (scheduledTasks.has(jobId)) {
      scheduledTasks.get(jobId)!.stop();
      scheduledTasks.delete(jobId);
    }

    // Validar que la expresión cron sea válida
    if (!cron.validate(cronExpression)) {
      console.error(`[Backup Scheduler] ✗ Cron inválido para "${jobName}": ${cronExpression}`);
      return;
    }

    const task = cron.schedule(cronExpression, async () => {
      console.log(`[Backup Scheduler] ⏰ Disparando: "${jobName}" (cron: ${cronExpression})`);

      const result = await backupEngineService.runJob(jobId);

      // Si falló, disparar alerta en el sistema NOC-NOC
      if (!result.success) {
        await backupAlertService.dispatchFailureAlert(jobId, jobName, result.error || 'Error desconocido');
      } else {
        // Si había una alerta activa previa, marcarla como resuelta
        await backupAlertService.resolveBackupAlert(jobId, jobName);
      }
    }, {
      timezone: 'America/Caracas',
    });

    scheduledTasks.set(jobId, task);
    console.log(`[Backup Scheduler]   → "${jobName}" programado: ${cronExpression}`);
  },

  /**
   * Cancela la programación de un job (cuando se desactiva o elimina)
   */
  unscheduleJob(jobId: string): void {
    if (scheduledTasks.has(jobId)) {
      scheduledTasks.get(jobId)!.stop();
      scheduledTasks.delete(jobId);
      console.log(`[Backup Scheduler] ⏹ Job ${jobId} removido del programador`);
    }
  },

  /**
   * Recarga la programación de un job específico (después de editar)
   */
  async reloadJob(jobId: string): Promise<void> {
    const job = await backupJobService.getJobById(jobId);
    if (!job) {
      this.unscheduleJob(jobId);
      return;
    }

    if (job.is_active) {
      this.scheduleJob(job.id, job.name, job.cron_schedule);
    } else {
      this.unscheduleJob(job.id);
    }
  },

  /**
   * Recarga completa: cancela todas las tareas y re-lee la DB
   */
  async reloadAll(): Promise<void> {
    console.log('[Backup Scheduler] Recargando todos los jobs...');

    // Cancelar todas las tareas actuales
    for (const [jobId, task] of scheduledTasks) {
      task.stop();
    }
    scheduledTasks.clear();

    // Re-programar desde la DB
    const jobs = await backupJobService.getAllJobs();
    const activeJobs = jobs.filter(j => j.is_active);

    for (const job of activeJobs) {
      this.scheduleJob(job.id, job.name, job.cron_schedule);
    }

    console.log(`[Backup Scheduler] ✓ ${activeJobs.length} jobs reprogramados`);
  },

  /**
   * Retorna el estado actual del scheduler (para monitoreo/debugging)
   */
  getStatus(): {
    initialized: boolean;
    scheduledJobsCount: number;
    jobs: Array<{ jobId: string }>;
  } {
    return {
      initialized: isInitialized,
      scheduledJobsCount: scheduledTasks.size,
      jobs: Array.from(scheduledTasks.keys()).map(id => ({ jobId: id })),
    };
  },

  /**
   * Detiene todas las tareas programadas (para shutdown limpio)
   */
  shutdown(): void {
    console.log('[Backup Scheduler] Deteniendo todas las tareas...');
    for (const [, task] of scheduledTasks) {
      task.stop();
    }
    scheduledTasks.clear();
    isInitialized = false;
    console.log('[Backup Scheduler] ✓ Scheduler detenido');
  },
};
