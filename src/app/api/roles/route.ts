import { NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';

export async function GET() {
  try {
    const roles = await userService.getRoles();
    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}
