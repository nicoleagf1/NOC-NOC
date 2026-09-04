import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
