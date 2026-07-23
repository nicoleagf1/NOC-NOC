import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    const { hostname, ip_address, environment, os_type, description, is_monitored } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (hostname !== undefined) {
      updates.push(`hostname = $${paramIndex++}`);
      values.push(hostname);
    }
    if (ip_address !== undefined) {
      updates.push(`ip_address = $${paramIndex++}`);
      values.push(ip_address);
    }
    if (environment !== undefined) {
      updates.push(`environment = $${paramIndex++}`);
      values.push(environment);
    }
    if (os_type !== undefined) {
      updates.push(`os_type = $${paramIndex++}`);
      values.push(os_type);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (is_monitored !== undefined) {
      updates.push(`is_monitored = $${paramIndex++}`);
      values.push(is_monitored);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE infrastructure_hosts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const res = await query(sql, values);
    
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Host not found' }, { status: 404 });
    }
    
    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Error updating host:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const res = await query('DELETE FROM infrastructure_hosts WHERE id = $1 RETURNING id', [id]);
    
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Host not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting host:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
