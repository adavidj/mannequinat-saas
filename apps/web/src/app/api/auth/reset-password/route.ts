import { NextResponse } from 'next/server';

import { resetPasswordSchema } from '@/features/auth/schemas';
import { API_URL } from '@/shared/lib/api-url';

type MessagePayload = { message?: string | string[] };

function readMessage(payload: unknown, fallback: string): string {
  const message = (payload as MessagePayload | null)?.message;
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  return typeof message === 'string' ? message : fallback;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
  } | null;
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? 'Demande invalide.' },
      { status: 400 },
    );
  }
  if (typeof body?.token !== 'string' || !body.token.trim()) {
    return NextResponse.json({ message: 'Lien de réinitialisation invalide.' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ token: body.token, password: parsed.data.password }),
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
      { message: readMessage(payload, 'Réinitialisation impossible.') },
      { status: upstream.status },
    );
  }

  return NextResponse.json({
    message: readMessage(payload, 'Mot de passe réinitialisé. Vous pouvez vous connecter.'),
  });
}
