import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { type, url, authType, authCredentials } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL es requerida' }, { status: 400 });
    }

    let testUrl = url;
    let headers: Record<string, string> = {};

    // Preparar autenticación si aplica
    if (authType === 'basic' && authCredentials) {
      // Basic auth usa "username:password" convertido a base64
      const encoded = Buffer.from(authCredentials).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    } else if (authType === 'bearer' && authCredentials) {
      headers['Authorization'] = `Bearer ${authCredentials}`;
    }

    // Adaptar la URL de prueba según el tipo
    if (type === 'prometheus') {
      // Prometheus tiene el endpoint -/healthy o el api/v1/query
      testUrl = `${url.replace(/\/$/, '')}/api/v1/query?query=up`;
    } else if (type === 'uptime-kuma') {
      // Para Uptime Kuma podemos testear el dashboard principal o un status
      testUrl = `${url.replace(/\/$/, '')}/`;
    }

    // Configurar timeout usando AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos max

    const response = await fetch(testUrl, { 
      method: 'GET', 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Conexión exitosa' });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: `El servidor respondió con error: ${response.status} ${response.statusText}` 
      });
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ success: false, error: 'La conexión excedió el tiempo de espera (Timeout).' });
    }
    return NextResponse.json({ success: false, error: error.message || 'Error de red al conectar con el servidor.' });
  }
}
