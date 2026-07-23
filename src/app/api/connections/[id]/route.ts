import { NextResponse } from 'next/server';
import { connectionService } from '@/lib/services/connectionService';

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const body = await request.json();
    
    const updatedConnection = await connectionService.updateConnection(id, body);
    
    if (!updatedConnection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return NextResponse.json(updatedConnection);
  } catch (error: any) {
    console.error(`Error updating connection ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const deleted = await connectionService.deleteConnection(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error(`Error deleting connection ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
  }
}
