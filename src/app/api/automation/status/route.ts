import { NextResponse } from 'next/server';
import { n8nService } from '@/lib/services/n8nService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const conn = await n8nService.getActiveConnection();

    if (!conn) {
      return NextResponse.json({
        configured: false,
        isActive: false,
        message: 'No hay ninguna conexión de n8n registrada en el sistema.'
      });
    }

    if (!conn.isActive) {
      return NextResponse.json({
        configured: true,
        isActive: false,
        name: conn.name,
        url: conn.url,
        authType: conn.authType,
        message: 'La integración con n8n está deshabilitada en la configuración.'
      });
    }

    // Probar conectividad en vivo
    const testResult = await n8nService.testConnection(
      conn.url, 
      conn.authType, 
      conn.authCredentials
    );

    return NextResponse.json({
      configured: true,
      isActive: true,
      id: conn.id,
      name: conn.name,
      url: conn.url,
      authType: conn.authType,
      isOnline: testResult.success,
      latencyMs: testResult.latencyMs || 0,
      statusCode: testResult.statusCode,
      message: testResult.message,
      lastChecked: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching n8n status:', error);
    return NextResponse.json(
      { configured: false, isActive: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
