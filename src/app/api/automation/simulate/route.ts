import { NextResponse } from 'next/server';
import { n8nService } from '@/lib/services/n8nService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventType = 'firing',
      serviceName = 'SRV-PROD-TEST',
      metricTrigger = 'HighCPUUsage',
      severity = 'CRITICAL',
      technicalDetail = 'Evento de prueba disparado desde el Simulador NOC-NOC'
    } = body;

    const payload = {
      eventType: eventType as 'firing' | 'resolved',
      incidentId: `sim-${Date.now()}`,
      serviceId: `sim-${serviceName}`,
      serviceName,
      metricTrigger,
      severity,
      technicalDetail,
      timestamp: new Date().toISOString()
    };

    const dispatchResult = await n8nService.dispatchIncidentEvent(payload);

    return NextResponse.json({
      success: dispatchResult.success,
      message: dispatchResult.message,
      statusCode: dispatchResult.statusCode,
      latencyMs: dispatchResult.latencyMs,
      payloadSent: payload
    });
  } catch (error: any) {
    console.error('Error simulating n8n event:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error al ejecutar simulación' },
      { status: 500 }
    );
  }
}
