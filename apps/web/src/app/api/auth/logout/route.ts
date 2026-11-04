import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { API_URL } from '@/shared/lib/api-url';
import { ACCESS_COOKIE, clearSessionCookies } from '@/shared/lib/cookies';

export async function POST(): Promise<NextResponse> {
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
      cache: 'no-store',
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ message: 'Déconnexion réussie.' });
  clearSessionCookies(response);
  return response;
}
