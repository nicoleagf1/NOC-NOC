import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const monitorName = data.monitor?.name || 'Servicio Desconocido';
    const serviceId = data.monitor?.id ? String(data.monitor.id) : monitorName;
    const status = data.heartbeat?.status; // 0 o 1
    const msg = data.msg || data.heartbeat?.msg || '';
    
    if (status === 0) {
      // CAÍDA -> INSERT NUEVO INCIDENTE
      await query(
        `INSERT INTO alert_incident_history 
          (service_id, service_name, metric_trigger, severity, current_status, technical_detail, triggered_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [serviceId, monitorName, 'uptime_ping', 'CRITICAL', 'ACTIVA', msg]
      );
      // ACTUALIZAR ESTADO DEL SERVICIO
      await query(
        `UPDATE business_services SET current_status = 'CAÍDO' WHERE uptime_kuma_monitor_id = $1`,
        [data.monitor?.id]
      );
    } else if (status === 1) {
      // RECUPERADO -> UPDATE (El Trigger PostgreSQL actualizará el estado a RESUELTA automáticamente)
      await query(
        `UPDATE alert_incident_history 
         SET resolved_at = NOW(), technical_detail = CONCAT(technical_detail, ' | Resuelto: ', $1::text)
         WHERE service_id = $2 AND current_status != 'RESUELTA'`,
        [msg, serviceId]
      );
      // ACTUALIZAR ESTADO DEL SERVICIO
      await query(
        `UPDATE business_services SET current_status = 'DISPONIBLE' WHERE uptime_kuma_monitor_id = $1`,
        [data.monitor?.id]
      );
    } else {
      // WARNING / ESTADOS DEGRADADOS
      await query(
        `INSERT INTO alert_incident_history 
          (service_id, service_name, metric_trigger, severity, current_status, technical_detail, triggered_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [serviceId, monitorName, 'uptime_ping_warning', 'WARNING', 'ACTIVA', msg]
      );
      // ACTUALIZAR ESTADO DEL SERVICIO
      await query(
        `UPDATE business_services SET current_status = 'DEGRADADO' WHERE uptime_kuma_monitor_id = $1`,
        [data.monitor?.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Uptime Kuma Webhook Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
