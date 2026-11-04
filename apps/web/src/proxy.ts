import { NextResponse, type NextRequest } from 'next/server';

import { API_URL } from './shared/lib/api-url';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  USER_COOKIE,
  accessCookieOptions,
  base64UrlDecode,
  clearSessionCookies,
  decodeUser,
  refreshCookieOptions,
} from './shared/lib/cookies';
import type { SessionUser, UserRole } from './shared/types/api';

type RoleRule = { prefix: string; roles: UserRole[] };

/**
 * Les espaces ci-dessous ont des rôles exclusifs. Le reste du tableau de bord
 * est accessible à tout compte authentifié et l'API applique ses propres
 * contrôles : cette table ne sert qu'à éviter les impasses de navigation.
 */
const ROLE_RULES: RoleRule[] = [
  { prefix: '/dashboard/profil', roles: ['MODELE'] },
  { prefix: '/dashboard/photos', roles: ['MODELE'] },
  { prefix: '/dashboard/decouverte', roles: ['AGENCE'] },
  { prefix: '/dashboard/organisation', roles: ['AGENCE', 'FORMATEUR'] },
  { prefix: '/dashboard/admin', roles: ['ADMIN'] },
];

const AUTH_PAGES = new Set(['/connexion', '/inscription']);

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const user = decodeUser(request.cookies.get(USER_COOKIE)?.value);

  if (AUTH_PAGES.has(pathname)) {
    if (user && (accessToken || refreshToken)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const sessionUser: SessionUser | null = user;
  let currentAccessToken = accessToken;

  if ((!currentAccessToken || isTokenExpired(currentAccessToken)) && refreshToken) {
    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
      return redirectToLogin(request, pathname + search);
    }
    currentAccessToken = rotated.accessToken;
    response.cookies.set(ACCESS_COOKIE, rotated.accessToken, accessCookieOptions());
    response.cookies.set(REFRESH_COOKIE, rotated.refreshToken, refreshCookieOptions());
  }

  if (!sessionUser || !currentAccessToken) {
    return redirectToLogin(request, pathname + search);
  }

  const rule = ROLE_RULES.find(
    (candidate) => pathname === candidate.prefix || pathname.startsWith(`${candidate.prefix}/`),
  );
  if (rule && !rule.roles.includes(sessionUser.role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

function redirectToLogin(request: NextRequest, nextPath: string): NextResponse {
  const target = new URL(`/connexion?next=${encodeURIComponent(nextPath)}`, request.url);
  const redirect = NextResponse.redirect(target);
  clearSessionCookies(redirect);
  return redirect;
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  return payload.exp * 1000 <= Date.now() + 5_000;
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }
  try {
    return JSON.parse(base64UrlDecode(payload)) as { exp?: number };
  } catch {
    return null;
  }
}

async function rotateRefreshToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { accessToken?: unknown; refreshToken?: unknown };
    if (typeof data.accessToken !== 'string' || typeof data.refreshToken !== 'string') {
      return null;
    }
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/connexion', '/inscription'],
};
