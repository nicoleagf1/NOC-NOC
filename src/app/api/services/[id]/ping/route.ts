import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    // Buscar el servicio en la BD (puede ser ID o slug)
    const res = await query('SELECT endpoint_url, monitor_type FROM business_services WHERE id::text = $1 OR slug = $1', [id]);
    
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const service = res.rows[0];
    let url = service.endpoint_url;

    if (!url || (service.monitor_type !== 'http' && service.monitor_type !== 'keyword')) {
      // Si no es un endpoint HTTP, o no hay URL, retornamos error simulado
      return NextResponse.json({ error: 'Ping only supported for HTTP endpoints currently.' }, { status: 400 });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }

    const startTime = Date.now();
    try {
      // Configuramos un timeout rápido (ej. 5s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const pingRes = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      
      const isUp = pingRes.ok || pingRes.status < 500;
      
      return NextResponse.json({
        success: true,
        data: {
          latencyMs,
          status: isUp ? 'up' : 'down',
          statusCode: pingRes.status
        }
      });
    } catch (fetchError: any) {
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        data: {
          latencyMs,
          status: 'down',
          error: fetchError.message || 'Connection failed'
        }
      });
    }

  } catch (error: any) {
    console.error('Error in force ping:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
