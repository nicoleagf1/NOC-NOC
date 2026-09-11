import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { connectionService } from '@/lib/services/connectionService';
import { io } from 'socket.io-client';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { monitor_interval, maxretries } = body;

    const parsedInterval = parseInt(monitor_interval);
    if (isNaN(parsedInterval) || parsedInterval < 1) {
      return NextResponse.json({ error: 'El intervalo debe ser de al menos 1 segundo' }, { status: 400 });
    }

    const parsedRetries = maxretries !== undefined ? Math.max(0, parseInt(maxretries) || 0) : 1;

    // Actualizar DB local fusionando monitor_config para no perder propiedades previas
    const monitorConfigStr = JSON.stringify({ maxretries: parsedRetries });
    const res = await query(
      `UPDATE business_services 
       SET monitor_interval = $1, 
           monitor_config = COALESCE(monitor_config, '{}'::jsonb) || $2::jsonb 
       WHERE id::text = $3 OR slug = $3 
       RETURNING *`,
      [parsedInterval, monitorConfigStr, id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const service = res.rows[0];

    // Sincronizar edición con Uptime Kuma
    if (service.uptime_kuma_monitor_id) {
      try {
        const kumaConn = await connectionService.getActiveConnection('uptime-kuma');
        if (kumaConn && kumaConn.url) {
          const socket = io(kumaConn.url, { transports: ['websocket'], reconnection: false, timeout: 5000 });
          
          await new Promise<void>((resolve, reject) => {
            socket.on('connect', () => {
              const fetchAndEdit = () => {
                // Primero necesitamos el monitor actual para no sobreescribir otros campos
                socket.emit('getMonitor', service.uptime_kuma_monitor_id, (resGet: any) => {
                  if (resGet.ok && resGet.monitor) {
                    const monitor = resGet.monitor;
                    monitor.interval = parsedInterval;
                    monitor.retryInterval = parsedInterval;
                    monitor.maxretries = parsedRetries;
                    
                    socket.emit('editMonitor', monitor, (resEdit: any) => {
                      socket.disconnect();
                      resolve();
                    });
                  } else {
                     socket.disconnect();
                     resolve();
                  }
                });
              };

              if (kumaConn.authType === 'basic' && kumaConn.authCredentials) {
                const [username, password] = kumaConn.authCredentials.split(':');
                socket.emit('login', { username, password, token: '' }, (resAuth: any) => {
                  if (resAuth.ok) fetchAndEdit();
                  else { socket.disconnect(); reject(new Error('Kuma Auth Failed')); }
                });
              } else {
                fetchAndEdit();
              }
            });
            socket.on('connect_error', () => {
              socket.disconnect();
              resolve(); 
            });
            setTimeout(() => { socket.disconnect(); resolve(); }, 3000);
          });
        }
      } catch (kumaError) {
        console.error('Error sincronizando config con Kuma:', kumaError);
      }
    }

    return NextResponse.json({ success: true, service });

  } catch (error: any) {
    console.error('Error updating threshold config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
