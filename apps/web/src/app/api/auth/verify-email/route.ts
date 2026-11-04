import { NextResponse } from 'next/server';

import { verifyEmailSchema } from '@/features/auth/schemas';
import { API_URL } from '@/shared/lib/api-url';

type ErrorPayload = { message?: string | string[] };

function errorMessage(payload: unknown, fallback: string): string {
  const message = (payload as ErrorPayload | null)?.message;
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  return typeof message === 'string' ? message : fallback;
}

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = verifyEmailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Jeton invalide.' },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(parsed.data),
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

  return NextResponse.json({ message: errorMessage(payload, 'Adresse e-mail vérifiée.') });
}
