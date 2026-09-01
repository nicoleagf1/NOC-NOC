import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
          await query(
            `INSERT INTO alert_incident_history 
              (service_id, service_name, metric_trigger, severity, current_status, technical_detail, triggered_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [serviceId, instance, alertname, severity, 'ACTIVA', summary]
          );
        }
      } else if (status === 'resolved') {
        // Marcar como resuelta
        await query(
          `UPDATE alert_incident_history 
           SET resolved_at = NOW(), technical_detail = CONCAT(technical_detail, ' | Resuelto: Autorecuperación de Prometheus')
           WHERE service_id = $1 AND current_status != 'RESUELTA'`,
          [serviceId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Prometheus Webhook Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
