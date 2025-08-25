import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  const adminId = await fetchMutation(api.auth.createAdmin, { name, email, password });

  return NextResponse.json({ adminId });
}
