import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authService } from '@/lib/services/authService';
import { mailService } from '@/lib/services/mailService';

export async function POST(request: Request) {
  try {
    const { usernameOrEmail } = await request.json();

    if (!usernameOrEmail) {
      return NextResponse.json({ error: 'Falta el usuario o correo' }, { status: 400 });
    }

    // Buscar al usuario por email o username
    const userRes = await query(
      'SELECT id, username, email, password_hash, is_active FROM users WHERE username = $1 OR email = $1 LIMIT 1',
      [usernameOrEmail]
    );

    const user = userRes.rows[0];

    // Por seguridad, siempre devolvemos un estado 200 aunque no exista el usuario
    // para evitar ataques de enumeración de usuarios.
    if (!user || !user.is_active) {
      return NextResponse.json({ success: true, message: 'Si el usuario existe, se envió el correo.' });
    }

    // Generar el token stateless
    const token = await authService.signRecoveryToken(user.id, user.password_hash);

    // Construir la URL de recuperación
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}&id=${user.id}`;

    // Enviar el correo
    const emailSent = await mailService.sendPasswordRecoveryEmail(user.email, resetUrl, user.username);

    if (!emailSent) {
      console.error('Failed to send recovery email to', user.email);
      // Podríamos retornar un 500, pero seguimos las mejores prácticas de no relevar si falló a un atacante
    }

    return NextResponse.json({ success: true, message: 'Si el usuario existe, se envió el correo.' });

  } catch (error: any) {
    console.error('Recover Password Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
