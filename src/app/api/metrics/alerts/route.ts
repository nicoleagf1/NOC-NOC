import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query(`
      SELECT a.*, b.endpoint_url 
      FROM alert_incident_history a
      LEFT JOIN business_services b ON b.uptime_kuma_monitor_id::varchar = a.service_id
      ORDER BY a.triggered_at DESC
      LIMIT 100
    `);

    const alerts = res.rows.map(row => {
      let sev = 'INFORMATIVO';
      let sevVar = 'info';
      if (row.severity === 'CRITICAL') { sev = 'CRÍTICO'; sevVar = 'danger'; }
      else if (row.severity === 'WARNING') { sev = 'ADVERTENCIA'; sevVar = 'warning'; }

      const dateObj = new Date(row.triggered_at);
      const date = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
      const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Calcular duración
      let durationStr = '--:--:--';
      const end = row.resolved_at ? new Date(row.resolved_at) : new Date();
      const diffMs = end.getTime() - dateObj.getTime();
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      durationStr = `${String(diffHrs).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;

      return {
        id: row.id,
        sev,
        sevVar,
        date,
        time,
        source: 'UPTIME KUMA',
        sourceCol: 'text-green-600 bg-green-50',
        host: row.service_name || 'Desconocido',
        hostSub: row.endpoint_url || row.service_id,
        desc: row.metric_trigger === 'uptime_ping' ? 'Servicio no disponible (Down)' : 'Alerta detectada',
        descSub: row.technical_detail || '',
        status: row.current_status,
        duration: durationStr
      };
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
