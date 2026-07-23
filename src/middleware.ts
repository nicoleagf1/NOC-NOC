import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/change-password', '/api/webhooks/uptime-kuma'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Ignorar estáticos, next internals y rutas públicas puras
  if (
    path.startsWith('/_next') || 
    path.startsWith('/favicon') ||
    publicRoutes.includes(path)
  ) {
    return NextResponse.next();
  }

  // Verificar la cookie de sesión
  const sessionCookie = request.cookies.get('noc_session')?.value;

  if (!sessionCookie) {
    // Si es una ruta de la API y no tiene sesión, devuelve 401
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // Si es una página web, redirige al login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    const secretKey = new TextEncoder().encode(process.env.APP_SECRET);
    // Verificamos el token con jose (soporte nativo para Edge runtime de middleware)
    await jwtVerify(sessionCookie, secretKey);
    return NextResponse.next();
  } catch (err) {
    console.error('Invalid token in middleware', err);
    // Token inválido o expirado
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Además borramos la cookie para limpiar la sesión rota
    const response = NextResponse.redirect(url);
    response.cookies.delete('noc_session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Aplica a todo excepto:
     * - API públicas o manejadas arriba explícitamente
     * - Imágenes y estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
