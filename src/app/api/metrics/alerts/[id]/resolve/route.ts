import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const incidentId = params.id;
    
    if (!incidentId) {
      return NextResponse.json({ error: 'Falta el ID del incidente' }, { status: 400 });
    }

    const res = await query(`
      UPDATE alert_incident_history 
      SET current_status = 'RESUELTA', resolved_at = NOW() 
      WHERE incident_id = $1 AND current_status = 'ACTIVA'
      RETURNING *
    `, [incidentId]);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Alerta no encontrada o ya está resuelta' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, alert: res.rows[0] });
  } catch (error) {
    console.error('Error resolving single alert:', error);
    return NextResponse.json({ success: false, error: 'Failed to resolve alert' }, { status: 500 });
  }
}
