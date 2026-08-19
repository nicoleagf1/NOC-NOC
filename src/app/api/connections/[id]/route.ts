import { NextResponse } from 'next/server';
import { connectionService } from '@/lib/services/connectionService';

import { updateConnectionSchema } from '@/lib/validations/schemas';

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  let id = "unknown";
  try {
    const params = await props.params;
    id = params.id;
    const json = await request.json();
    const result = updateConnectionSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const body = result.data;
    
    const updatedConnection = await connectionService.updateConnection(id, body);
    
    if (!updatedConnection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json(updatedConnection);
  } catch (error: any) {
    console.error(`Error updating connection ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  let id = "unknown";
  try {
    const params = await props.params;
    id = params.id;
    const deleted = await connectionService.deleteConnection(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error(`Error deleting connection ${id}:`, error);
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
  }
}
