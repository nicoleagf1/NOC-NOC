import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { n8nService } from '@/lib/services/n8nService';

/**
 * Valida de forma segura el token secreto enviado por Alertmanager (SEC-MON-01)
 */
function verifyWebhookToken(request: Request): boolean {
  const expectedToken = process.env.PROMETHEUS_WEBHOOK_SECRET;

  // Si no está configurado el secreto en las variables de entorno, emitir advertencia
  if (!expectedToken) {
    console.warn('[SECURITY WARNING] PROMETHEUS_WEBHOOK_SECRET no está definido. El webhook de Prometheus está operando sin autenticación.');
    return true;
  }

  // 1. Extraer del Header Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization') || '';
  let providedToken = '';
  if (authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.substring(7).trim();
  }

  // 2. Extraer del Header X-Webhook-Secret
  if (!providedToken) {
    providedToken = request.headers.get('x-webhook-secret')?.trim() || '';
  }

  // 3. Extraer del Query Parameter ?token=<token>
  if (!providedToken) {
    try {
      const url = new URL(request.url);
      providedToken = url.searchParams.get('token')?.trim() || '';
    } catch {
      // Ignorar error al parsear URL
    }
  }

  if (!providedToken) {
    return false;
  }

  // Comparación resistente a ataques de temporización (timing attack resistant)
  const expectedBuffer = Buffer.from(expectedToken, 'utf-8');
  const providedBuffer = Buffer.from(providedToken, 'utf-8');

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function POST(request: Request) {
  // Validación obligatoria de seguridad (Control SEC-MON-01)
  if (!verifyWebhookToken(request)) {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'IP desconocida';
    console.warn(`[SECURITY ALERT] Petición no autorizada al webhook de Prometheus desde: ${clientIp}`);
    return NextResponse.json(
      { 
        error: 'No autorizado: Se requiere un token Bearer o encabezado X-Webhook-Secret válido para enviar alertas a NOC-NOC.',
        code: 'UNAUTHORIZED_WEBHOOK'
      }, 
      { status: 401 }
    );
  }

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
