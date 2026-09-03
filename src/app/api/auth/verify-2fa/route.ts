import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/authService';
import { userService } from '@/lib/services/userService';
import { verifySync } from 'otplib';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const pendingToken = cookieStore.get('noc_2fa_pending')?.value;

    if (!pendingToken) {
      return NextResponse.json({ error: 'Sesión expirada o no iniciada' }, { status: 401 });
    }

    const payload = await authService.verify2faPendingToken(pendingToken);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const user = await userService.getUserById(payload.userId);
    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Usuario inactivo o no encontrado' }, { status: 403 });
    }

    if (!user.two_factor_secret) {
      return NextResponse.json({ error: '2FA no configurado correctamente' }, { status: 400 });
    }

    const result = verifySync({ token: code, secret: user.two_factor_secret });
    if (!result.valid) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 401 });
    }

    // Código válido, emitimos el token de sesión real
    const token = await authService.signToken({
      userId: user.id,
      username: user.username,
      roleId: user.role_id,
    });

    await userService.updateLastLogin(user.id);

    const isHttps = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';

    const response = NextResponse.json({ success: true, redirectUrl: '/' });

    // Setear cookie real
    response.cookies.set({
      name: 'noc_session',
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12
    });

    // Eliminar la cookie temporal
    response.cookies.delete('noc_2fa_pending');

    return response;
  } catch (error: any) {
    console.error('Verify 2FA Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
