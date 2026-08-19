import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/authService';
import { userService } from '@/lib/services/userService';
import { cookies } from 'next/headers';

import { loginSchema } from '@/lib/validations/schemas';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = loginSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { username, password } = result.data;

    const user = await userService.getUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'El usuario se encuentra inactivo' }, { status: 403 });
    }

    const isValid = await authService.verifyPassword(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Si el usuario necesita cambiar su contraseña, le avisamos al frontend antes de crear la cookie normal
    if (user.must_change_password) {
      // Podemos crear un token temporal o simplemente indicarle al frontend que muestre el paso 2
      return NextResponse.json({
        success: true,
        mustChangePassword: true,
        userId: user.id // para que el frontend sepa a quién le cambia la clave
      });
    }

    // Si todo está bien, creamos la sesión
    const token = await authService.signToken({
      userId: user.id,
      username: user.username,
      roleId: user.role_id,
    });

    await userService.updateLastLogin(user.id);

    const isHttps = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';

    const response = NextResponse.json({ success: true, redirectUrl: '/' });

    // Setear cookie en la respuesta (más seguro y compatible en Route Handlers)
    response.cookies.set({
      name: 'noc_session',
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12 // 12 horas
    });

    return response;

  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
