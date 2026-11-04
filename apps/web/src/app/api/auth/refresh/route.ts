import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { API_URL } from '@/shared/lib/api-url';
import { REFRESH_COOKIE, clearSessionCookies, setTokenCookies } from '@/shared/lib/cookies';

type RefreshPayload = { accessToken?: unknown; refreshToken?: unknown };

export async function POST(): Promise<NextResponse> {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    const response = NextResponse.json({ message: 'Session expirée.' }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  const upstream = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  }).catch(() => null);

  const payload = (await upstream?.json().catch(() => null)) as RefreshPayload | null;
  if (
    !upstream?.ok ||
    typeof payload?.accessToken !== 'string' ||
    typeof payload.refreshToken !== 'string'
  ) {
    const response = NextResponse.json({ message: 'Session expirée.' }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  const response = NextResponse.json({ message: 'Session rafraîchie.' });
  setTokenCookies(response, {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  });
  return response;
}
