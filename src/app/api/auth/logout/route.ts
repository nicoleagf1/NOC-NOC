import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Eliminar la cookie de sesión
    (await cookies()).delete('noc_session');
    
    return NextResponse.json({ success: true, redirectUrl: '/login' });
  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}
