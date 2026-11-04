import { cookies } from 'next/headers';

import type { SessionUser } from '../types/api';
import { ACCESS_COOKIE, USER_COOKIE, decodeUser } from './cookies';

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return decodeUser(store.get(USER_COOKIE)?.value);
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}
