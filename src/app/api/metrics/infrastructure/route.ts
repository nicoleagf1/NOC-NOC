import { NextResponse } from 'next/server';
import { getInfrastructureDashboardData } from '@/lib/services/metricsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grupo = searchParams.get('grupo') || 'TODOS';
    const periodo = searchParams.get('periodo') || '24h';
    
    const data = await getInfrastructureDashboardData(grupo, periodo);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in /api/metrics/infrastructure:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
