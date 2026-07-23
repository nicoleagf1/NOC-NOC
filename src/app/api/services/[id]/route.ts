import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { connectionService } from '@/lib/services/connectionService';
import { io } from 'socket.io-client';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    const { name, slug, endpoint_url, current_status, uptime_kuma_monitor_id, monitor_type, monitor_interval, monitor_config } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(slug);
    }
    if (endpoint_url !== undefined) {
      updates.push(`endpoint_url = $${paramIndex++}`);
      values.push(endpoint_url);
    }
    if (current_status !== undefined) {
      updates.push(`current_status = $${paramIndex++}`);
      values.push(current_status);
    }
    if (uptime_kuma_monitor_id !== undefined) {
      updates.push(`uptime_kuma_monitor_id = $${paramIndex++}`);
      values.push(uptime_kuma_monitor_id);
    }
    if (monitor_type !== undefined) {
      updates.push(`monitor_type = $${paramIndex++}`);
      values.push(monitor_type);
    }
    if (monitor_interval !== undefined) {
      updates.push(`monitor_interval = $${paramIndex++}`);
      values.push(monitor_interval);
    }
    if (monitor_config !== undefined) {
      updates.push(`monitor_config = $${paramIndex++}`);
      values.push(monitor_config);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `UPDATE business_services SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const res = await query(sql, values);
    
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    let updatedService = res.rows[0];
    
    // Si no tiene monitorId y hay endpoint, intentar aprovisionarlo en Uptime Kuma
    if (!updatedService.uptime_kuma_monitor_id && updatedService.endpoint_url) {
      try {
        console.log(`[Aprovisionamiento PUT] Iniciando creación de monitor en Uptime Kuma para ${updatedService.name}...`);
        const kumaConn = await connectionService.getActiveConnection('uptime-kuma');
        
        if (kumaConn && kumaConn.url) {
          const socket = io(kumaConn.url, {
            transports: ['websocket'],
            reconnection: false,
            timeout: 5000
          });

          const monitorId = await new Promise<number | null>((resolve, reject) => {
            socket.on('connect', () => {
              const addMonitor = () => {
                const monitorType = updatedService.monitor_type || 'http';
                let payload: any = {
                  type: monitorType,
                  name: updatedService.name,
                  interval: updatedService.monitor_interval ? parseInt(updatedService.monitor_interval) : 60,
                  retryInterval: updatedService.monitor_interval ? parseInt(updatedService.monitor_interval) : 60,
                  maxretries: 0,
                  upsideDown: false,
                  accepted_statuscodes: ["200-299"]
                };

                const config = updatedService.monitor_config || {};

                if (monitorType === 'ping') {
                  payload.hostname = updatedService.endpoint_url;
                } else if (monitorType === 'dns') {
                  payload.hostname = updatedService.endpoint_url;
                  if (config.dns_resolve_server) payload.dns_resolve_server = config.dns_resolve_server;
                  if (config.dns_resolve_type) payload.dns_resolve_type = config.dns_resolve_type;
                } else if (monitorType === 'port') {
                  payload.hostname = updatedService.endpoint_url;
                  if (config.port) payload.port = parseInt(config.port);
                } else if (monitorType === 'keyword') {
                  payload.url = updatedService.endpoint_url;
                  if (config.keyword) payload.keyword = config.keyword;
                } else {
                  payload.url = updatedService.endpoint_url;
                }

                socket.emit('add', payload, (resKuma: any) => {
                  socket.disconnect();
                  if (resKuma.ok) resolve(resKuma.monitorID);
                  else reject(new Error(resKuma.msg || 'Error adding monitor'));
                });
              };

              if (kumaConn.authType === 'basic' && kumaConn.authCredentials) {
                const [username, password] = kumaConn.authCredentials.split(':');
                socket.emit('login', { username, password, token: '' }, (resAuth: any) => {
                  if (resAuth.ok) addMonitor();
                  else { socket.disconnect(); reject(new Error('Kuma Auth Failed')); }
                });
              } else addMonitor();
            });
            socket.on('connect_error', (err) => reject(err));
            setTimeout(() => { socket.disconnect(); reject(new Error('Kuma connection timeout')); }, 5000);
          });
          
          if (monitorId) {
             console.log(`[Aprovisionamiento PUT] Monitor creado exitosamente en Kuma (ID: ${monitorId})`);
             await query('UPDATE business_services SET uptime_kuma_monitor_id = $1 WHERE id = $2', [monitorId, updatedService.id]);
             updatedService.uptime_kuma_monitor_id = monitorId;
          }
        }
      } catch (kumaError) {
        console.error('Error conectando a Uptime Kuma en PUT:', kumaError);
      }
    }

    return NextResponse.json(updatedService);
  } catch (error: any) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    
    // Intentar eliminarlo también de Kuma si tiene monitor ID
    const resSrv = await query('SELECT uptime_kuma_monitor_id FROM business_services WHERE id = $1', [id]);
    const monitorId = resSrv.rows[0]?.uptime_kuma_monitor_id;

    if (monitorId) {
      try {
        console.log(`[Aprovisionamiento DELETE] Intentando eliminar monitor ID ${monitorId} en Kuma...`);
        const kumaConn = await connectionService.getActiveConnection('uptime-kuma');
        
        if (kumaConn && kumaConn.url) {
          const socket = io(kumaConn.url, { transports: ['websocket'], reconnection: false, timeout: 5000 });
          
          await new Promise<void>((resolve) => {
            socket.on('connect', () => {
              const deleteMon = () => {
                socket.emit('deleteMonitor', monitorId, (resDel: any) => {
                  console.log('[Aprovisionamiento DELETE] Kuma response:', resDel);
                  socket.disconnect();
                  resolve();
                });
              };
              
              if (kumaConn.authType === 'basic' && kumaConn.authCredentials) {
                const [username, password] = kumaConn.authCredentials.split(':');
                socket.emit('login', { username, password, token: '' }, (resAuth: any) => {
                  if (resAuth.ok) deleteMon();
                  else { socket.disconnect(); resolve(); }
                });
              } else {
                deleteMon();
              }
            });
            socket.on('connect_error', () => resolve());
            setTimeout(() => { socket.disconnect(); resolve(); }, 3000);
          });
        }
      } catch (kumaError) {
        console.error('Error eliminando en Uptime Kuma:', kumaError);
      }
    }
    const res = await query('DELETE FROM business_services WHERE id = $1 RETURNING id', [id]);
    
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
