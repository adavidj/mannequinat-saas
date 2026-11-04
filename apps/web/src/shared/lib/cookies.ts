import type { SessionUser } from '../types/api';

export const ACCESS_COOKIE = 'mb_access';
export const REFRESH_COOKIE = 'mb_refresh';
export const USER_COOKIE = 'mb_user';

/**
 * Les durées de vie des cookies suivent les TTL JWT par défaut (15 min / 7 j).
 * Le rafraîchissement est pris en charge par `src/proxy.ts` : un cookie de
 * session un peu plus long que le jeton n'est donc pas un problème.
 */
export const ACCESS_MAX_AGE_SECONDS = 15 * 60;
export const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

type CookieOptions = {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge?: number;
};

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export function accessCookieOptions(): CookieOptions {
  return { ...baseCookieOptions(), maxAge: ACCESS_MAX_AGE_SECONDS };
}

export function refreshCookieOptions(): CookieOptions {
  return { ...baseCookieOptions(), maxAge: REFRESH_MAX_AGE_SECONDS };
}

export function userCookieOptions(): CookieOptions {
  return { ...baseCookieOptions(), maxAge: REFRESH_MAX_AGE_SECONDS };
}

export function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeUser(user: SessionUser): string {
  return base64UrlEncode(JSON.stringify(user));
}

export function decodeUser(value: string | undefined): SessionUser | null {
  if (!value) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(value));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as SessionUser).id === 'string' &&
      typeof (parsed as SessionUser).email === 'string' &&
      typeof (parsed as SessionUser).role === 'string'
    ) {
      return parsed as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

type CookieWriter = {
  cookies: {
    set: (name: string, value: string, options: CookieOptions) => unknown;
    delete: (name: string) => unknown;
  };
};

export function setSessionCookies(
  response: CookieWriter,
  session: { accessToken: string; refreshToken: string; user: SessionUser },
): void {
  response.cookies.set(ACCESS_COOKIE, session.accessToken, accessCookieOptions());
  response.cookies.set(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
  response.cookies.set(USER_COOKIE, encodeUser(session.user), userCookieOptions());
}

export function setTokenCookies(
  response: CookieWriter,
  tokens: { accessToken: string; refreshToken: string },
): void {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions());
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
}

export function clearSessionCookies(response: CookieWriter): void {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(USER_COOKIE);
}
