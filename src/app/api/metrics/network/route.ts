import { NextResponse } from 'next/server';
import { getNetworkDashboardData } from '@/lib/services/metricsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || '24h';

    const data = await getNetworkDashboardData(periodo);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching network metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching network metrics' },
      { status: 500 }
    );
  }
}
