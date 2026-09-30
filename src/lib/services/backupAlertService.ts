/**
 * NOC-NOC Backup Alert Service
 * ===============================
 * Integra los fallos de respaldo con el sistema de alertas existente de NOC-NOC:
 *   1. Registra incidentes en alert_incident_history (misma tabla que Prometheus)
 *   2. Despacha notificaciones a n8n para workflow de emails/Telegram/etc.
 *
 * El serviceId sigue el formato: backup-{jobId}
 * para no colisionar con las alertas de Prometheus (prom-*).
 */

import { query } from '@/lib/db';
import { n8nService } from './n8nService';

export const backupAlertService = {
  /**
   * Crea una alerta de fallo de backup en el sistema NOC-NOC.
   * - Inserta en alert_incident_history con status = ACTIVA
   * - Despacha evento a n8n para notificación externa (email, Telegram, etc.)
   */
  async dispatchFailureAlert(
    jobId: string,
    jobName: string,
    errorMessage: string
  ): Promise<void> {
    const serviceId = `backup-${jobId}`;

    try {
      // 1. Verificar si ya existe una alerta activa para este job (evitar duplicados)
      const checkRes = await query(
        `SELECT incident_id FROM alert_incident_history WHERE service_id = $1 AND current_status = 'ACTIVA'`,
        [serviceId]
      );

      if (checkRes.rows.length > 0) {
        // Ya existe una alerta activa, actualizar el detalle técnico
        await query(
          `UPDATE alert_incident_history 
           SET technical_detail = $1, triggered_at = NOW()
           WHERE service_id = $2 AND current_status = 'ACTIVA'`,
          [
            `[Backup] Fallo recurrente en "${jobName}": ${errorMessage}`,
            serviceId,
          ]
        );
        console.log(`[Backup Alert] ⚠ Alerta existente actualizada para: ${jobName}`);
      } else {
        // 2. Insertar nueva alerta en el historial de incidentes del NOC
        const insertRes = await query(
          `INSERT INTO alert_incident_history 
            (service_id, service_name, metric_trigger, severity, current_status, technical_detail, triggered_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING incident_id`,
          [
            serviceId,
            `Backup: ${jobName}`,
            'BACKUP_FAILED',
            'CRITICAL',
            'ACTIVA',
            `[Backup Automático] El respaldo "${jobName}" falló: ${errorMessage}`,
          ]
        );

        console.log(`[Backup Alert] 🚨 Alerta creada: ${jobName} (incident: ${insertRes.rows[0]?.incident_id})`);

        // 3. Despachar evento a n8n para notificación externa
        n8nService.dispatchIncidentEvent({
          eventType: 'firing',
          incidentId: insertRes.rows[0]?.incident_id || serviceId,
          serviceId,
          serviceName: `Backup: ${jobName}`,
          metricTrigger: 'BACKUP_FAILED',
          severity: 'CRITICAL',
          technicalDetail: `El respaldo automático "${jobName}" falló. Error: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        }).catch((e) =>
          console.warn('[Backup Alert] Error notificando a n8n:', e.message)
        );
      }
    } catch (error: any) {
      console.error(`[Backup Alert] Error registrando alerta para "${jobName}":`, error.message);
    }
  },

  /**
   * Resuelve una alerta de backup previamente activa (cuando el backup se recupera).
   * - Marca el incidente como RESUELTA en alert_incident_history
   * - Notifica a n8n la recuperación
   */
  async resolveBackupAlert(jobId: string, jobName: string): Promise<void> {
    const serviceId = `backup-${jobId}`;

    try {
      const updateRes = await query(
        `UPDATE alert_incident_history 
         SET current_status = 'RESUELTA', 
             resolved_at = NOW(), 
             technical_detail = CONCAT(technical_detail, ' | Resuelto: Backup exitoso posterior')
         WHERE service_id = $1 AND current_status = 'ACTIVA'
         RETURNING incident_id`,
        [serviceId]
      );

      if (updateRes.rows.length > 0) {
        console.log(`[Backup Alert] ✓ Alerta resuelta: ${jobName}`);

        // Notificar recuperación a n8n
        n8nService.dispatchIncidentEvent({
          eventType: 'resolved',
          incidentId: updateRes.rows[0]?.incident_id || serviceId,
          serviceId,
          serviceName: `Backup: ${jobName}`,
          metricTrigger: 'BACKUP_FAILED',
          severity: 'CRITICAL',
          technicalDetail: `El respaldo "${jobName}" se ha recuperado exitosamente.`,
          timestamp: new Date().toISOString(),
        }).catch((e) =>
          console.warn('[Backup Alert] Error notificando recuperación a n8n:', e.message)
        );
      }
    } catch (error: any) {
      console.error(`[Backup Alert] Error resolviendo alerta para "${jobName}":`, error.message);
    }
  },
};
