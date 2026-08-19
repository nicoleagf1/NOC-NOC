import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { authService } from '@/lib/services/authService';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

import { changePasswordSchema } from '@/lib/validations/schemas';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = changePasswordSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { userId, newPassword } = result.data;

    const success = await userService.changePassword(userId, newPassword);

    if (!success) {
      return NextResponse.json({ error: 'No se pudo cambiar la contraseña' }, { status: 400 });
    }

    // Tras el cambio exitoso, debemos emitir el JWT de sesión para que entre directo
    // Pero necesitamos traer el usuario de nuevo para armar el token
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/login-raw?userId=${userId}`); 
    // Para simplificar y no hacer fetch propio, mejor hacemos la query
    // Pero no tenemos "getUserById", así que haré una consulta directa aquí o la agrego al service.
    
    // Mejor solución:
    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (user) {
      const token = await authService.signToken({
        userId: user.id,
        username: user.username,
        roleId: user.role_id,
      });

      await userService.updateLastLogin(user.id);

      (await cookies()).set({
        name: 'noc_session',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12
      });
    }

    return NextResponse.json({ success: true, redirectUrl: '/' });

  } catch (error: any) {
    console.error('Change Password Error:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor', stack: error.stack }, { status: 500 });
  }
}
