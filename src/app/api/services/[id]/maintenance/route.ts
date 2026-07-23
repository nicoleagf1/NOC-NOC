import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { connectionService } from '@/lib/services/connectionService';
import { io } from 'socket.io-client';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { is_maintenance } = await req.json();

    if (typeof is_maintenance !== 'boolean') {
      return NextResponse.json({ error: 'is_maintenance boolean is required' }, { status: 400 });
    }

    // Actualizar DB local (puede ser slug o uuid)
    const res = await query(
      'UPDATE business_services SET is_maintenance = $1 WHERE id::text = $2 OR slug = $2 RETURNING *',
      [is_maintenance, id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const service = res.rows[0];

    // Intentar sincronizar con Uptime Kuma si tiene monitorId
    if (service.uptime_kuma_monitor_id) {
      try {
        const kumaConn = await connectionService.getActiveConnection('uptime-kuma');
        if (kumaConn && kumaConn.url) {
          const socket = io(kumaConn.url, { transports: ['websocket'], reconnection: false, timeout: 5000 });
          
          await new Promise<void>((resolve, reject) => {
            socket.on('connect', () => {
              const toggleMonitor = () => {
                const event = is_maintenance ? 'pauseMonitor' : 'resumeMonitor';
                socket.emit(event, service.uptime_kuma_monitor_id, (resKuma: any) => {
                  socket.disconnect();
                  resolve();
                });
              };

              if (kumaConn.authType === 'basic' && kumaConn.authCredentials) {
                const [username, password] = kumaConn.authCredentials.split(':');
                socket.emit('login', { username, password, token: '' }, (resAuth: any) => {
                  if (resAuth.ok) toggleMonitor();
                  else { socket.disconnect(); reject(new Error('Kuma Auth Failed')); }
                });
              } else {
                toggleMonitor();
              }
            });
            socket.on('connect_error', () => {
              socket.disconnect();
              resolve(); // Resolve anyway so it doesn't break our DB update
            });
            setTimeout(() => { socket.disconnect(); resolve(); }, 3000);
          });
        }
      } catch (kumaError) {
        console.error('Error sincronizando mantenimiento con Kuma:', kumaError);
      }
    }

    return NextResponse.json({ success: true, is_maintenance: service.is_maintenance });

  } catch (error: any) {
    console.error('Error toggling maintenance mode:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
