import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';

import { updateUserSchema } from '@/lib/validations/schemas';

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  let id = "unknown";
  try {
    const params = await props.params;
    id = params.id;
    const json = await request.json();
    const result = updateUserSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const body = result.data;
    
    const success = await userService.updateUser(id, body);
    
    if (!success) {
      return NextResponse.json({ error: 'User not found or no changes applied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error updating user ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
