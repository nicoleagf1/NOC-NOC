import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'La desactivación de 2FA no está permitida: el segundo factor de autenticación es obligatorio por directiva de seguridad de la plataforma.',
    },
    { status: 403 }
  );
}
