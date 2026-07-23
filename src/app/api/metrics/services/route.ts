import { NextResponse } from 'next/server';
import { getServiceStatuses } from '@/lib/services/metricsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const services = await getServiceStatuses();

    return NextResponse.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error in /api/metrics/services:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch services status' }, { status: 500 });
  }
}
