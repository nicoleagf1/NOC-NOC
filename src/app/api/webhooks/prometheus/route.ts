import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { n8nService } from '@/lib/services/n8nService';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || !payload.alerts) {
      return NextResponse.json({ error: 'Payload de Alertmanager inválido' }, { status: 400 });
    }

    for (const alert of payload.alerts) {
      const status = alert.status; // 'firing' o 'resolved'
      const alertname = alert.labels?.alertname || 'PrometheusAlert';
      const instance = alert.labels?.instance || 'Desconocido';
      const severityRaw = alert.labels?.severity?.toUpperCase() || 'CRITICAL';
      const severity = severityRaw === 'WARNING' || severityRaw === 'INFO' ? severityRaw : 'CRITICAL';
      const summary = alert.annotations?.summary || alert.annotations?.description || 'Alerta de infraestructura detectada';

      const serviceId = `prom-${alertname}-${instance}`;
      
      if (status === 'firing') {
        // Verificar si ya existe una alerta activa para no duplicar
        const checkRes = await query(
          `SELECT incident_id FROM alert_incident_history WHERE service_id = $1 AND current_status = 'ACTIVA'`,
          [serviceId]
        );

        if (checkRes.rows.length === 0) {
          const insertRes = await query(
            `INSERT INTO alert_incident_history 
              (service_id, service_name, metric_trigger, severity, current_status, technical_detail, triggered_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING incident_id`,
            [serviceId, instance, alertname, severity, 'ACTIVA', summary]
          );

          // Notificar asíncronamente a n8n
          n8nService.dispatchIncidentEvent({
            eventType: 'firing',
            incidentId: insertRes.rows[0]?.incident_id || serviceId,
            serviceId,
            serviceName: instance,
            metricTrigger: alertname,
            severity,
            technicalDetail: summary,
            timestamp: new Date().toISOString()
          }).catch(e => console.warn('[n8n notify error]:', e));
        }
      } else if (status === 'resolved') {
        // Marcar como resuelta
        const updateRes = await query(
          `UPDATE alert_incident_history 
           SET current_status = 'RESUELTA', resolved_at = NOW(), technical_detail = CONCAT(technical_detail, ' | Resuelto: Autorecuperación de Prometheus')
           WHERE service_id = $1 AND current_status != 'RESUELTA'
           RETURNING incident_id`,
          [serviceId]
        );

        // Notificar asíncronamente a n8n la recuperación
        if (updateRes.rows.length > 0) {
          n8nService.dispatchIncidentEvent({
            eventType: 'resolved',
            incidentId: updateRes.rows[0]?.incident_id || serviceId,
            serviceId,
            serviceName: instance,
            metricTrigger: alertname,
            severity,
            technicalDetail: `${summary} | Resuelto`,
            timestamp: new Date().toISOString()
          }).catch(e => console.warn('[n8n notify error]:', e));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Prometheus Webhook Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
