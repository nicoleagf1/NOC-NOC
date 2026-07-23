import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { connectionService } from '@/lib/services/connectionService';
import { io } from 'socket.io-client';

export async function GET() {
  try {
    const res = await query('SELECT * FROM business_services ORDER BY created_at DESC');
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, endpoint_url, current_status, monitor_type, monitor_interval, monitor_config } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Faltan campos requeridos (name, slug)' }, { status: 400 });
    }

    // 1. Guardar en Base de Datos Local
    const res = await query(
      `INSERT INTO business_services (name, slug, endpoint_url, current_status, monitor_type, monitor_interval, monitor_config) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        name, 
        slug, 
        endpoint_url || null, 
        current_status || 'DISPONIBLE',
        monitor_type || 'http',
        monitor_interval ? parseInt(monitor_interval) : 60,
        monitor_config ? JSON.stringify(monitor_config) : '{}'
      ]
    );

    const newService = res.rows[0];

    // 2. Intentar Aprovisionar en Uptime Kuma Automáticamente
    let monitorId = null;
    try {
      if (endpoint_url) {
        console.log(`[Aprovisionamiento] Iniciando creación de monitor en Uptime Kuma para ${name}...`);
        
        const kumaConn = await connectionService.getActiveConnection('uptime-kuma');
        
        if (kumaConn && kumaConn.url) {
          const socket = io(kumaConn.url, {
            transports: ['websocket'],
            reconnection: false,
            timeout: 5000
          });

          monitorId = await new Promise<number | null>((resolve, reject) => {
            socket.on('connect', () => {
              const addMonitor = () => {
                const monitorType = monitor_type || 'http';
                let payload: any = {
                  type: monitorType,
                  name: name,
                  interval: monitor_interval ? parseInt(monitor_interval) : 60,
                  retryInterval: monitor_interval ? parseInt(monitor_interval) : 60,
                  maxretries: 0,
                  upsideDown: false,
                  accepted_statuscodes: ["200-299"] // Uptime Kuma requiere este array incluso para Ping/DNS
                };

                const config = monitor_config || {};

                if (monitorType === 'ping') {
                  payload.hostname = endpoint_url;
                } else if (monitorType === 'dns') {
                  payload.hostname = endpoint_url;
                  if (config.dns_resolve_server) payload.dns_resolve_server = config.dns_resolve_server;
                  if (config.dns_resolve_type) payload.dns_resolve_type = config.dns_resolve_type;
                } else if (monitorType === 'port') {
                  payload.hostname = endpoint_url;
                  if (config.port) payload.port = parseInt(config.port);
                } else if (monitorType === 'keyword') {
                  payload.url = endpoint_url;
                  if (config.keyword) payload.keyword = config.keyword;
                } else {
                  payload.url = endpoint_url;
                }

                socket.emit('add', payload, (res: any) => {
                  socket.disconnect();
                  if (res.ok) {
                    resolve(res.monitorID);
                  } else {
                    reject(new Error(res.msg || 'Error adding monitor'));
                  }
                });
              };

              if (kumaConn.authType === 'basic' && kumaConn.authCredentials) {
                const [username, password] = kumaConn.authCredentials.split(':');
                socket.emit('login', {
                  username,
                  password,
                  token: '' // Token en caso de usar 2FA, pero lo mantenemos simple
                }, (res: any) => {
                  if (res.ok) {
                    addMonitor();
                  } else {
                    socket.disconnect();
                    reject(new Error('Kuma Auth Failed'));
                  }
                });
              } else {
                addMonitor();
              }
            });

            socket.on('connect_error', (err) => {
              reject(err);
            });
            
            setTimeout(() => {
              socket.disconnect();
              reject(new Error('Kuma connection timeout'));
            }, 5000);
          });
          
          if (monitorId) {
             console.log(`[Aprovisionamiento] Monitor creado exitosamente en Kuma (ID: ${monitorId})`);
             await query('UPDATE business_services SET uptime_kuma_monitor_id = $1 WHERE id = $2', [monitorId, newService.id]);
             newService.uptime_kuma_monitor_id = monitorId;
          }
        } else {
          console.log('[Aprovisionamiento] No hay conexión activa a Uptime Kuma.');
        }
      }
    } catch (kumaError: any) {
      console.error('Error conectando a Uptime Kuma en POST:', kumaError);
      // Rollback: Eliminar el servicio de la base de datos si falla el aprovisionamiento
      await query('DELETE FROM business_services WHERE id = $1', [newService.id]);
      return NextResponse.json({ error: 'Fallo al provisionar en Uptime Kuma: ' + (kumaError.message || kumaError) }, { status: 500 });
    }

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    console.error('Error creating service:', error);
    if (error.code === '23505') { // unique violation
      return NextResponse.json({ error: 'El nombre o slug ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
