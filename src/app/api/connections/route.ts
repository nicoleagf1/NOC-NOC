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

import { createConnectionSchema } from '@/lib/validations/schemas';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = createConnectionSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const body = result.data;

    const newConnection = await connectionService.createConnection(body);

    if (body.type === 'fortigate') {
      const { fortigateService } = require('@/lib/services/fortigateService');
      await fortigateService.syncFortigateYaml();
    }

    return NextResponse.json(newConnection, { status: 201 });
  } catch (error: any) {
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}
