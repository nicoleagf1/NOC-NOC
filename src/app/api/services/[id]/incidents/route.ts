import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    // Primero verificamos si el id es un UUID o un slug, para encontrar el service_id real
    const serviceRes = await query('SELECT id FROM business_services WHERE id::text = $1 OR slug = $1', [id]);
    
    if (serviceRes.rowCount === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    const realServiceId = serviceRes.rows[0].id;

    // Obtenemos los últimos 20 incidentes
    const incidentsRes = await query(
      'SELECT id, incident_type, severity, summary, status, triggered_at, resolved_at, duration_seconds FROM incident_history WHERE service_id = $1 ORDER BY triggered_at DESC LIMIT 20',
      [realServiceId]
    );

    return NextResponse.json({ success: true, incidents: incidentsRes.rows });
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
