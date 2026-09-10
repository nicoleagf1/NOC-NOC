import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/authService';
import { userService } from '@/lib/services/userService';
import { loginSchema } from '@/lib/validations/schemas';
import { checkRateLimit, recordFailure, resetLimit, getClientIp } from '@/lib/security/rateLimiter';
import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = loginSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { username, password } = result.data;
    const ip = getClientIp(request);
    const rateLimitKey = `login:${ip}:${username.trim().toLowerCase()}`;

    // SEC-IAM-02: Rate Limiting preventivo (5 intentos por 15 minutos)
    const limitCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (limitCheck.isBlocked) {
      const minutes = Math.ceil(limitCheck.retryAfterSeconds / 60);
      return NextResponse.json(
        {
          error: `Demasiados intentos fallidos. Su acceso ha sido bloqueado temporalmente. Por favor, espere ${minutes} minuto(s) antes de intentar nuevamente.`,
          retryAfter: limitCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limitCheck.retryAfterSeconds) },
        }
      );
    }

    const user = await userService.getUserByUsername(username);

    if (!user) {
      const failure = recordFailure(rateLimitKey, 5, 15 * 60 * 1000);
      const msg = failure.isBlocked
        ? 'Demasiados intentos fallidos. Su acceso ha sido bloqueado temporalmente por 15 minutos.'
        : `Credenciales inválidas. Intentos restantes: ${failure.remainingAttempts}`;
      return NextResponse.json(
        { error: msg, retryAfter: failure.retryAfterSeconds },
        {
          status: failure.isBlocked ? 429 : 401,
          ...(failure.isBlocked ? { headers: { 'Retry-After': String(failure.retryAfterSeconds) } } : {}),
        }
      );
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'El usuario se encuentra inactivo' }, { status: 403 });
    }

    const isValid = await authService.verifyPassword(password, user.password_hash);

    if (!isValid) {
      const failure = recordFailure(rateLimitKey, 5, 15 * 60 * 1000);
      const msg = failure.isBlocked
        ? 'Demasiados intentos fallidos. Su acceso ha sido bloqueado temporalmente por 15 minutos.'
        : `Credenciales inválidas. Intentos restantes: ${failure.remainingAttempts}`;
      return NextResponse.json(
        { error: msg, retryAfter: failure.retryAfterSeconds },
        {
          status: failure.isBlocked ? 429 : 401,
          ...(failure.isBlocked ? { headers: { 'Retry-After': String(failure.retryAfterSeconds) } } : {}),
        }
      );
    }

    // Credenciales correctas: reiniciar contador de fallos para este usuario/IP
    resetLimit(rateLimitKey);

    // Si el usuario necesita cambiar su contraseña, le avisamos al frontend antes de continuar
    if (user.must_change_password) {
      return NextResponse.json({
        success: true,
        mustChangePassword: true,
        userId: user.id,
      });
    }

    const isHttps = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';

    // SEC-IAM-01: Autenticación de Doble Factor (2FA) Obligatoria
    // Si el usuario ya tiene 2FA configurado con secreto válido:
    if (user.is_two_factor_enabled && user.two_factor_secret) {
      const pendingToken = await authService.sign2faPendingToken(user.id, undefined, '2fa_pending');

      const response = NextResponse.json({ success: true, requires2FA: true });
      response.cookies.set({
        name: 'noc_2fa_pending',
        value: pendingToken,
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        maxAge: 5 * 60, // 5 minutos
      });
      return response;
    }

    // Si NO tiene 2FA configurado, se fuerza el enrolamiento obligatorio antes de dar acceso a la plataforma:
    const secret = generateSecret();
    const otpauth = generateURI({ label: user.email || user.username, issuer: 'NOC-NOC', secret });
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    const pendingToken = await authService.sign2faPendingToken(user.id, secret, '2fa_setup_pending');

    const response = NextResponse.json({
      success: true,
      requires2FASetup: true,
      qrDataUrl,
      secret,
    });

    response.cookies.set({
      name: 'noc_2fa_pending',
      value: pendingToken,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutos para enrolamiento inicial
    });

    return response;
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
