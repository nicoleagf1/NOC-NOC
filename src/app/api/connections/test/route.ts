import { NextResponse } from 'next/server';
import { connectionService } from '@/lib/services/connectionService';
import { isMasked } from '@/lib/security';
import { n8nService } from '@/lib/services/n8nService';
import https from 'node:https';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { id, type, url, authType = 'none', authCredentials = '' } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL es requerida' }, { status: 400 });
    }

    let testUrl = url;
    let credentials = authCredentials;
    if (id && (!credentials || isMasked(credentials))) {
      const savedConnection = await connectionService.getConnectionById(id, false);
      credentials = savedConnection?.authCredentials || '';
    }

    // 1. Caso especial: Integración con n8n
    if (type === 'n8n') {
      const result = await n8nService.testConnection(testUrl, authType, credentials);
      return NextResponse.json({
        success: result.success,
        message: result.message,
        error: result.success ? undefined : result.message,
        latencyMs: result.latencyMs
      });
    }

    let headers: Record<string, string> = {};
    const usesBearer = authType === 'bearer' || type === 'fortigate';
    if (authType === 'basic' && credentials) {
      const encoded = Buffer.from(credentials).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    } else if (usesBearer && credentials) {
      headers['Authorization'] = `Bearer ${credentials}`;
    }

    // Adaptar la URL de prueba según el tipo
    if (type === 'prometheus') {
      testUrl = `${url.replace(/\/$/, '')}/api/v1/query?query=up`;
    } else if (type === 'fortigate') {
      testUrl = `${url.replace(/\/$/, '')}/api/v2/monitor/system/status`;
    } else if (type === 'uptime-kuma') {
      testUrl = `${url.replace(/\/$/, '')}/`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = type === 'fortigate'
      ? await axios.get(testUrl, {
          headers,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          signal: controller.signal,
          timeout: 6000,
          validateStatus: () => true
        })
      : await fetch(testUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
          cache: 'no-store'
        });
    
    clearTimeout(timeoutId);

    if (response.status >= 200 && response.status < 300) {
      return NextResponse.json({ 
        success: true, 
        message: `Conexión exitosa con ${type} (HTTP ${response.status})` 
      });
    } else if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ 
        success: false, 
        error: `Servidor alcanzado, pero credenciales rechazadas (HTTP ${response.status})` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: `El servidor respondió con error: ${response.status} ${response.statusText || ''}` 
      });
    }

  } catch (error: any) {
    if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
      return NextResponse.json({ success: false, error: 'La conexión excedió el tiempo de espera (>6s).' });
    }
    return NextResponse.json({ success: false, error: error.message || 'Error de red al conectar con el servidor.' });
  }
}
