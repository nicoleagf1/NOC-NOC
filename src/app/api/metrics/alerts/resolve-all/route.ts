import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT() {
  try {
    const res = await query(`
      UPDATE alert_incident_history 
      SET current_status = 'RESUELTA', resolved_at = NOW() 
      WHERE current_status = 'ACTIVA'
    `);
    
    return NextResponse.json({ success: true, affectedRows: res.rowCount });
  } catch (error) {
    console.error('Error resolving alerts:', error);
    return NextResponse.json({ success: false, error: 'Failed to resolve alerts' }, { status: 500 });
  }
}
