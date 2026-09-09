import { NextResponse } from 'next/server';
import { n8nService } from '@/lib/services/n8nService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await n8nService.getWorkflows();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching n8n workflows:', error);
    return NextResponse.json(
      { success: false, workflows: [], error: error.message || 'Error interno al consultar workflows' },
      { status: 500 }
    );
  }
}
