import { NextResponse } from 'next/server';

import { API_URL } from '@/shared/lib/api-url';

type ErrorPayload = { message?: string | string[] };

function errorMessage(payload: unknown, fallback: string): string {
  const message = (payload as ErrorPayload | null)?.message;
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  return typeof message === 'string' ? message : fallback;
}

/**
 * Démarre l'enrôlement TOTP d'un administrateur. Le jeton de défi provient de
 * la réponse de connexion : aucun cookie de session n'existe encore.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as { challengeToken?: unknown } | null;
  if (typeof body?.challengeToken !== 'string' || !body.challengeToken) {
    return NextResponse.json({ message: 'Jeton de vérification manquant.' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/2fa/setup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ challengeToken: body.challengeToken }),
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
      { message: errorMessage(payload, 'Initialisation de la double authentification impossible.') },
      { status: upstream.status },
    );
  }

  return NextResponse.json(payload);
}
