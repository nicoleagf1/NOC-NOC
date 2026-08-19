import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authService } from '@/lib/services/authService';
import { userService } from '@/lib/services/userService';

import { resetPasswordSchema } from '@/lib/validations/schemas';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = resetPasswordSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { id, token, newPassword } = result.data;

    // 1. Obtener el usuario actual para sacar su password_hash
    const userRes = await query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_active = true',
      [id]
    );

    const user = userRes.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 400 });
    }

    // 2. Verificar el token usando el hash actual
    const payload = await authService.verifyRecoveryToken(token, user.password_hash);

    if (!payload || payload.userId !== id) {
      return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 400 });
    }

    // 3. Cambiar la contraseña
    const success = await userService.changePassword(id, newPassword);

    if (!success) {
      return NextResponse.json({ error: 'No se pudo actualizar la contraseña' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Contraseña actualizada con éxito' });

  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
