import { NextResponse } from 'next/server';
import { connectionService } from '@/lib/services/connectionService';

export async function GET() {
  try {
    const connections = await connectionService.getAllConnections();
    return NextResponse.json(connections);
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validaciones básicas
    if (!body.name || !body.type || !body.url) {
      return NextResponse.json({ error: 'Name, type, and url are required' }, { status: 400 });
    }
    
    if (body.type !== 'prometheus' && body.type !== 'uptime-kuma') {
      return NextResponse.json({ error: 'Invalid connection type' }, { status: 400 });
    }

    const newConnection = await connectionService.createConnection(body);
    return NextResponse.json(newConnection, { status: 201 });
  } catch (error: any) {
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}
