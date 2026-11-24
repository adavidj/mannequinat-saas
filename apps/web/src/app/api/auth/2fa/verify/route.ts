import { NextResponse } from 'next/server';

import { API_URL } from '@/shared/lib/api-url';
import { setSessionCookies } from '@/shared/lib/cookies';
import type { AuthResponse } from '@/shared/types/api';

type ErrorPayload = { message?: string | string[] };

function errorMessage(payload: unknown, fallback: string): string {
  const message = (payload as ErrorPayload | null)?.message;
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  return typeof message === 'string' ? message : fallback;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as
    | { challengeToken?: unknown; code?: unknown }
    | null;
  if (typeof body?.challengeToken !== 'string' || !body.challengeToken) {
    return NextResponse.json({ message: 'Jeton de vérification manquant.' }, { status: 400 });
  }
  if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) {
    return NextResponse.json(
      { message: 'Le code de vérification doit contenir six chiffres.' },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ challengeToken: body.challengeToken, code: body.code }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: "L'API est indisponible. Vérifiez qu'elle est démarrée." },
      { status: 502 },
    );
  }

  const payload: unknown = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(
      { message: errorMessage(payload, 'Vérification impossible.') },
      { status: upstream.status },
    );
  }

  const auth = payload as AuthResponse;
  const response = NextResponse.json({ user: auth.user });
  setSessionCookies(response, auth);
  return response;
}
