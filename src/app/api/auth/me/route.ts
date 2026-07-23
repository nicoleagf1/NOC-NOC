import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/authService';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const sessionCookie = (await cookies()).get('noc_session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await authService.verifyToken(sessionCookie);
    
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userRes = await query(`
      SELECT u.id, u.username, u.first_name, u.last_name, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = $1
    `, [payload.userId]);

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const user = userRes.rows[0];

    return NextResponse.json({ 
      user: {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        roleName: user.role_name
      }
    });
  } catch (error) {
    console.error('Me Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
