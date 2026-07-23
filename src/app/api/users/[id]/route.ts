import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const body = await request.json();
    
    const success = await userService.updateUser(id, body);
    
    if (!success) {
      return NextResponse.json({ error: 'User not found or no changes applied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error updating user ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
