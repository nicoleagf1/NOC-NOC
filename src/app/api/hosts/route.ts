import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT * FROM infrastructure_hosts ORDER BY created_at DESC');
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Error fetching hosts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { hostname, ip_address, environment, os_type, description, is_monitored } = body;

    if (!hostname || !ip_address || !environment || !os_type) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO infrastructure_hosts (hostname, ip_address, environment, os_type, description, is_monitored) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [hostname, ip_address, environment, os_type, description, is_monitored !== undefined ? is_monitored : true]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating host:', error);
    if (error.code === '23505') { // unique violation
      return NextResponse.json({ error: 'El hostname ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
