import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { API_URL } from '@/shared/lib/api-url';
import { ACCESS_COOKIE } from '@/shared/lib/cookies';

type RouteContext = { params: Promise<{ path: string[] }> };

const SEGMENT_PATTERN = /^[A-Za-z0-9._~-]+$/;

/**
 * Proxy BFF générique : le navigateur appelle `/api/proxy/<chemin-api>` et le
 * serveur Next ajoute le jeton HttpOnly. Cela évite d'exposer les JWT au
 * JavaScript client tout en gardant une API REST simple côté écrans.
 */
export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  return forward(request, context, 'GET');
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  return forward(request, context, 'POST');
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  return forward(request, context, 'PATCH');
}

export async function DELETE(request: Request, context: RouteContext): Promise<NextResponse> {
  return forward(request, context, 'DELETE');
}

async function forward(
  request: Request,
  context: RouteContext,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
): Promise<NextResponse> {
  const { path } = await context.params;
  if (!path?.length || !path.every((segment) => SEGMENT_PATTERN.test(segment))) {
    return NextResponse.json({ message: 'Chemin API invalide.' }, { status: 400 });
  }

  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json({ message: 'Session expirée. Reconnectez-vous.' }, { status: 401 });
  }

  const target = new URL(`${API_URL}/${path.join('/')}`);
  new URL(request.url).searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  const headers: Record<string, string> = {
    accept: 'application/json',
    authorization: `Bearer ${accessToken}`,
  };
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['content-type'] = contentType;
  }

  let body: ArrayBuffer | undefined;
  if (method === 'POST' || method === 'PATCH') {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, cache: 'no-store' });
  } catch {
    return NextResponse.json(
      { message: "L'API est indisponible. Réessayez dans un instant." },
      { status: 502 },
    );
  }

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const payload = await upstream.arrayBuffer();
  return new NextResponse(payload, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  });
}
