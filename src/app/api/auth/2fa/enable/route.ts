import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/authService';
import { query } from '@/lib/db';
import { verifySync } from 'otplib';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('noc_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await authService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { secret, code } = await request.json();
    
    if (!secret || !code) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const result = verifySync({ token: code, secret });
    
    if (!result.valid) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    // Guardar en base de datos
    await query(
      'UPDATE users SET two_factor_secret = $1, is_two_factor_enabled = TRUE WHERE id = $2',
      [secret, payload.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Enable 2FA Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
