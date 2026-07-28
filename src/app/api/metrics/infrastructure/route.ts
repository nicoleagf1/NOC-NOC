import { NextResponse } from 'next/server';
import { getInfrastructureDashboardData } from '@/lib/services/metricsService';

export async function GET() {
  try {
    const data = await getInfrastructureDashboardData();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in /api/metrics/infrastructure:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
