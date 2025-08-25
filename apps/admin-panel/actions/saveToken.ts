'use server';

import { COOKIE_TOKEN } from '@/config';
import { cookies } from 'next/headers';

export async function saveToken(token: string) {
  const cookie = await cookies();

  cookie.set(COOKIE_TOKEN, token, {
    path: '/',
  });
}
