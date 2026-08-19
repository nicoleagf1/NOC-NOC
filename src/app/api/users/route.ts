import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';

export async function GET() {
  try {
    const users = await userService.getAllUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

import { createUserSchema } from '@/lib/validations/schemas';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = createUserSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const body = result.data;

    const newUser = await userService.createUser(body);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 400 });
  }
}
