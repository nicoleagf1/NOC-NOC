import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { encrypt } from '@/lib/security';

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
    const { hostname, ip_address, environment, os_type, description, is_monitored, server_role, vault_username, vault_password } = body;

    if (!hostname || !ip_address || !environment || !os_type) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    let encryptedPassword = null;
    if (vault_password) {
      encryptedPassword = encrypt(vault_password);
    }

    const res = await query(
      `INSERT INTO infrastructure_hosts (hostname, ip_address, environment, os_type, description, is_monitored, server_role, vault_username, vault_password) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [hostname, ip_address, environment, os_type, description, is_monitored !== undefined ? is_monitored : true, server_role || 'Sin Asignar', vault_username || null, encryptedPassword]
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
