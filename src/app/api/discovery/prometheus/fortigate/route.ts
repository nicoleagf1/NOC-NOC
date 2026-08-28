import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  // Verificación básica de Basic Auth
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="NOC-NOC Prometheus Discovery"' }
    });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (username !== 'prometheus' || password !== 'secret123') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    // Obtener todos los firewalls Fortigate activos
    const res = await query(`
      SELECT url FROM monitoring_connections 
      WHERE type = 'fortigate' AND is_active = TRUE
    `);

    const targets = res.rows.map(row => row.url).filter(Boolean);

    // Formato requerido por file_sd_configs o http_sd_configs de Prometheus
    const responseData = targets.length > 0 ? [
      {
        targets,
        labels: {
          job: 'fortigate',
          discovered_by: 'noc-noc-app'
        }
      }
    ] : [];

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching prometheus fortigate targets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
