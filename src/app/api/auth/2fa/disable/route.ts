import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/authService';
import { query } from '@/lib/db';
import { userService } from '@/lib/services/userService';

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

    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 });
    }

    // Verificar la contraseña antes de permitir deshabilitar el 2FA por seguridad
    const user = await userService.getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const isValid = await authService.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Deshabilitar 2FA en BD
    await query(
      'UPDATE users SET two_factor_secret = NULL, is_two_factor_enabled = FALSE WHERE id = $1',
      [payload.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Disable 2FA Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
