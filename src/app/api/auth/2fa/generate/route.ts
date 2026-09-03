import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authService } from '@/lib/services/authService';
import { userService } from '@/lib/services/userService';
import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';

export async function GET(request: Request) {
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

    const user = await userService.getUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Generar nuevo secreto
    const secret = generateSecret();
    const otpauth = generateURI({ label: user.email, issuer: 'NOC-NOC', secret });
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    // En un sistema en producción estricto, podríamos guardar esto en una tabla temporal.
    // Para simplificar sin alterar mucho el modelo, enviamos el secreto al frontend de forma segura por HTTPS 
    // y cuando el frontend lo verifique, lo guarda. (Solo visible para el usuario autenticado)
    
    return NextResponse.json({
      success: true,
      secret,
      qrDataUrl
    });
  } catch (error: any) {
    console.error('Generate 2FA Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
