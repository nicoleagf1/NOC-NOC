import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/authService';
import { userService } from '@/lib/services/userService';
import { query } from '@/lib/db';
import { checkRateLimit, recordFailure, resetLimit, getClientIp } from '@/lib/security/rateLimiter';
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
      return NextResponse.json({ error: 'Token de autenticación inválido o expirado' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rateLimitKey = `verify-2fa:${ip}:${payload.userId}`;

    // SEC-IAM-02: Rate Limiting en verificación 2FA (5 intentos por 15 minutos)
    const limitCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (limitCheck.isBlocked) {
      const minutes = Math.ceil(limitCheck.retryAfterSeconds / 60);
      return NextResponse.json(
        {
          error: `Demasiados intentos fallidos de código 2FA. Bloqueado temporalmente. Por favor, espere ${minutes} minuto(s).`,
          retryAfter: limitCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limitCheck.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Código de 6 dígitos requerido' }, { status: 400 });
    }

    const user = await userService.getUserById(payload.userId);
    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Usuario inactivo o no encontrado' }, { status: 403 });
    }

    // Caso 1: Finalización de enrolamiento obligatorio de 2FA (SEC-IAM-01)
    if (payload.purpose === '2fa_setup_pending') {
      if (!payload.tempSecret) {
        return NextResponse.json({ error: 'Configuración 2FA inválida' }, { status: 400 });
      }

      const result = verifySync({ token: code, secret: payload.tempSecret });
      if (!result.valid) {
        const failure = recordFailure(rateLimitKey, 5, 15 * 60 * 1000);
        const msg = failure.isBlocked
          ? 'Demasiados intentos de código incorrecto. Bloqueado temporalmente por 15 minutos.'
          : `Código 2FA inválido. Intentos restantes: ${failure.remainingAttempts}`;
        return NextResponse.json(
          { error: msg, retryAfter: failure.retryAfterSeconds },
          {
            status: failure.isBlocked ? 429 : 401,
            ...(failure.isBlocked ? { headers: { 'Retry-After': String(failure.retryAfterSeconds) } } : {}),
          }
        );
      }

      // Código válido para enrolamiento: Guardar en BD permanentemente
      await query(
        'UPDATE users SET two_factor_secret = $1, is_two_factor_enabled = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [payload.tempSecret, user.id]
      );
    } 
    // Caso 2: Verificación de 2FA ya registrado
    else if (payload.purpose === '2fa_pending') {
      if (!user.two_factor_secret) {
        return NextResponse.json({ error: '2FA no configurado correctamente en el perfil' }, { status: 400 });
      }

      const result = verifySync({ token: code, secret: user.two_factor_secret });
      if (!result.valid) {
        const failure = recordFailure(rateLimitKey, 5, 15 * 60 * 1000);
        const msg = failure.isBlocked
          ? 'Demasiados intentos de código incorrecto. Bloqueado temporalmente por 15 minutos.'
          : `Código 2FA inválido. Intentos restantes: ${failure.remainingAttempts}`;
        return NextResponse.json(
          { error: msg, retryAfter: failure.retryAfterSeconds },
          {
            status: failure.isBlocked ? 429 : 401,
            ...(failure.isBlocked ? { headers: { 'Retry-After': String(failure.retryAfterSeconds) } } : {}),
          }
        );
      }
    } else {
      return NextResponse.json({ error: 'Propósito de token inválido' }, { status: 400 });
    }

    // Código válido -> Resetear límite de fallos
    resetLimit(rateLimitKey);

    // Emitir sesión definitiva
    const token = await authService.signToken({
      userId: user.id,
      username: user.username,
      roleId: user.role_id,
    });

    await userService.updateLastLogin(user.id);

    const isHttps = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';
    const response = NextResponse.json({ success: true, redirectUrl: '/' });

    // Guardar cookie de sesión autenticada
    response.cookies.set({
      name: 'noc_session',
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    // Eliminar la cookie temporal de 2FA pendiente
    response.cookies.delete('noc_2fa_pending');

    return response;
  } catch (error: any) {
    console.error('Verify 2FA Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
