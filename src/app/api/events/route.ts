import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authService } from '@/lib/services/authService';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Validar sesión (opcional pero recomendado para rutas protegidas)
    const sessionCookie = (await cookies()).get('noc_session')?.value;
    if (!sessionCookie || !(await authService.verifyToken(sessionCookie))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Todos los webhooks de monitorización escriben en el histórico unificado.
    const eventsRes = await query(`
      SELECT 
        incident_id as id,
        service_id,
        service_name,
        metric_trigger,
        severity,
        current_status as status,
        technical_detail as detail,
        triggered_at as date
      FROM alert_incident_history
      ORDER BY triggered_at DESC
      LIMIT 100
    `);

    // Mapeamos los resultados para adaptarlos al frontend
    const events = eventsRes.rows.map((row: any) => {
      const d = new Date(row.date);
      
      let uiSev = row.severity === 'CRITICAL' ? 'CRÍTICO' : row.severity === 'WARNING' ? 'ADVERTENCIA' : 'INFORMATIVO';
      if (row.status === 'RESUELTA') uiSev = 'RESUELTO';

      const isPrometheus = row.service_id.startsWith('prom-');
      const source = isPrometheus ? 'PROMETHEUS' : 'UPTIME KUMA';
      const sourceCol = isPrometheus ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
      
      return {
        id: row.id,
        date: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
        time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase(),
        type: row.status === 'RESUELTA' ? 'RESOLUCIÓN' : 'ALERTA',
        source,
        sourceCol,
        host: row.service_name,
        desc: row.detail || (row.metric_trigger === 'InstanceDown' ? 'Servidor inaccesible (Down)' : row.metric_trigger || 'Alerta detectada'),
        descSub: row.detail,
        sev: uiSev,
        sevVar: uiSev === 'CRÍTICO' ? 'danger' : uiSev === 'ADVERTENCIA' ? 'warning' : uiSev === 'RESUELTO' ? 'success' : 'info'
      };
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Events GET Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
