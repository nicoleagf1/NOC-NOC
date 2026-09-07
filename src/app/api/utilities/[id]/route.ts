import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    
    const { title, description, os_type, command, usage_instructions } = body;

    const res = await query(
      `UPDATE utilities_catalog 
       SET title = $1, description = $2, os_type = $3, command = $4, usage_instructions = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, description, os_type, command, usage_instructions, id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Utility not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error('Error updating utility:', error);
    return NextResponse.json({ success: false, error: 'Failed to update utility' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    
    const res = await query('DELETE FROM utilities_catalog WHERE id = $1 RETURNING id', [id]);
    
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Utility not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting utility:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete utility' }, { status: 500 });
  }
}
