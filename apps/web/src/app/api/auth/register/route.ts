import { NextResponse } from 'next/server';

import { registerSchema } from '@/features/auth/schemas';
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
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Inscription invalide.' },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        role: parsed.data.role,
        ...(parsed.data.birthDate ? { birthDate: parsed.data.birthDate } : {}),
      }),
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
      { message: errorMessage(payload, 'Inscription impossible.') },
      { status: upstream.status },
    );
  }

  const auth = payload as AuthResponse;
  const response = NextResponse.json({
    user: auth.user,
    message: auth.message,
    // Développement uniquement : aucun service d'e-mail n'est encore branché.
    emailVerificationToken: auth.emailVerificationToken,
  });
  setSessionCookies(response, auth);
  return response;
}
