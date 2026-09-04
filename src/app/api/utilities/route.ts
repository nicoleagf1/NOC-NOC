import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const res = await query('SELECT * FROM utilities_catalog ORDER BY created_at DESC');
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Error fetching utilities:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch utilities' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, os_type, command, usage_instructions } = body;
    
    if (!title || !description || !os_type || !command) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const res = await query(`
      INSERT INTO utilities_catalog (title, description, os_type, command, usage_instructions)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, description, os_type, command, usage_instructions || '']);

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error('Error adding utility:', error);
    return NextResponse.json({ success: false, error: 'Failed to add utility' }, { status: 500 });
  }
}
