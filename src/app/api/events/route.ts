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

    // Obtener los eventos, ordenados del más reciente al más antiguo
    const eventsRes = await query(`
      SELECT 
        id, 
        incident_type as type, 
        severity, 
        summary as desc, 
        status, 
        triggered_at as date,
        host_id
      FROM incident_history
      ORDER BY triggered_at DESC
      LIMIT 100
    `);

    // Mapeamos los resultados para adaptarlos al frontend
    const events = eventsRes.rows.map(row => {
      const d = new Date(row.date);
      
      let uiSev = row.severity === 'CRITICAL' ? 'CRÍTICO' : row.severity === 'WARNING' ? 'ADVERTENCIA' : 'INFORMATIVO';
      if (row.status === 'RESUELTA') uiSev = 'RESUELTO';
      
      return {
        id: row.id,
        date: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
        time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase(),
        type: row.status === 'RESUELTA' ? 'RESOLUCIÓN' : 'ALERTA',
        source: row.type.replace('_', ' '),
        sourceCol: row.type === 'UPTIME_KUMA' ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50',
        host: row.host_id ? 'HOST ASIGNADO' : 'SISTEMA EXTERNO',
        desc: row.desc,
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
