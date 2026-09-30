import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/backups/stats
 * Estadísticas globales del módulo de respaldos para KPIs del dashboard
 */
export async function GET() {
  try {
    const sql = `
      SELECT
        -- Total de trabajos
        (SELECT COUNT(*) FROM backup_jobs) AS total_jobs,
        (SELECT COUNT(*) FROM backup_jobs WHERE is_active = TRUE) AS active_jobs,

        -- Estadísticas del historial
        (SELECT COUNT(*) FROM backup_history WHERE status = 'SUCCESS') AS total_success,
        (SELECT COUNT(*) FROM backup_history WHERE status = 'FAILED') AS total_failed,
        (SELECT COUNT(*) FROM backup_history WHERE status = 'RUNNING') AS currently_running,

        -- Último backup exitoso
        (SELECT started_at FROM backup_history WHERE status = 'SUCCESS' ORDER BY started_at DESC LIMIT 1) AS last_success_date,

        -- Último fallo
        (SELECT started_at FROM backup_history WHERE status = 'FAILED' ORDER BY started_at DESC LIMIT 1) AS last_failure_date,

        -- Espacio total respaldado (últimas 24 horas)
        (SELECT COALESCE(SUM(file_size_bytes), 0) FROM backup_history 
         WHERE status = 'SUCCESS' AND started_at >= NOW() - INTERVAL '24 hours') AS bytes_last_24h,

        -- Espacio total respaldado (todo el historial)
        (SELECT COALESCE(SUM(file_size_bytes), 0) FROM backup_history 
         WHERE status = 'SUCCESS') AS total_bytes_backed_up,

        -- Duración promedio de los backups exitosos
        (SELECT COALESCE(AVG(duration_seconds), 0) FROM backup_history 
         WHERE status = 'SUCCESS') AS avg_duration_seconds,

        -- Tasa de éxito global (%)
        CASE 
          WHEN (SELECT COUNT(*) FROM backup_history WHERE status IN ('SUCCESS', 'FAILED')) > 0
          THEN ROUND(
            (SELECT COUNT(*)::numeric FROM backup_history WHERE status = 'SUCCESS') * 100.0 /
            (SELECT COUNT(*)::numeric FROM backup_history WHERE status IN ('SUCCESS', 'FAILED')),
            1
          )
          ELSE 100.0
        END AS success_rate;
    `;

    const res = await query(sql);
    const stats = res.rows[0];

    // Formatear bytes a unidades legibles
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
    };

    return NextResponse.json({
      totalJobs: parseInt(stats.total_jobs),
      activeJobs: parseInt(stats.active_jobs),
      totalSuccess: parseInt(stats.total_success),
      totalFailed: parseInt(stats.total_failed),
      currentlyRunning: parseInt(stats.currently_running),
      lastSuccessDate: stats.last_success_date,
      lastFailureDate: stats.last_failure_date,
      bytesLast24h: parseInt(stats.bytes_last_24h),
      bytesLast24hFormatted: formatBytes(parseInt(stats.bytes_last_24h)),
      totalBytesBackedUp: parseInt(stats.total_bytes_backed_up),
      totalBytesFormatted: formatBytes(parseInt(stats.total_bytes_backed_up)),
      avgDurationSeconds: Math.round(parseFloat(stats.avg_duration_seconds)),
      successRate: parseFloat(stats.success_rate),
    });
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de backups:', error);
    return NextResponse.json({ error: 'Error al consultar estadísticas' }, { status: 500 });
  }
}
