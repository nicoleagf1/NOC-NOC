import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Configurar credenciales básicas para el endpoint de Service Discovery
const SD_USERNAME = process.env.SD_USERNAME || 'prometheus';
const SD_PASSWORD = process.env.SD_PASSWORD || 'secret123';

export async function GET(req: Request) {
  try {
    // Validar Basic Auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Prometheus Service Discovery"' }
      });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (username !== SD_USERNAME || password !== SD_PASSWORD) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Obtener los hosts monitorizados
    const res = await query('SELECT * FROM infrastructure_hosts WHERE is_monitored = true');
    const hosts = res.rows;

    // Agrupar hosts por entorno (environment) para los targets de Prometheus
    const targetsByEnv: Record<string, string[]> = {};
    const hostsDetails: Record<string, any[]> = {};

    hosts.forEach(host => {
      if (!targetsByEnv[host.environment]) {
        targetsByEnv[host.environment] = [];
        hostsDetails[host.environment] = [];
      }
      // Asumimos que Node Exporter corre en el puerto 9100
      targetsByEnv[host.environment].push(`${host.ip_address}:9100`);
      hostsDetails[host.environment].push(host);
    });

    const sdConfig = Object.keys(targetsByEnv).map(env => ({
      targets: targetsByEnv[env],
      labels: {
        environment: env,
        job: 'node',
      }
    }));

    // Retornamos el JSON esperado por prometheus http_sd_configs
    return NextResponse.json(sdConfig);
  } catch (error: any) {
    console.error('Error in Service Discovery:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
