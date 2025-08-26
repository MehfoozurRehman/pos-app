import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function POST(request: Request) {
  try {
    const { shopId, password } = await request.json();

    if (!shopId || !password) {
      return NextResponse.json({ error: 'Shop ID and password are required' });
    }

    const shop = await fetchMutation(api.shops.authenticateShop, { shopId, password });

    return NextResponse.json(shop);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message });
    }
    return NextResponse.json({ error: 'An unknown error occurred' });
  }
}
