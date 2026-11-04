import { cookies } from 'next/headers';

import { API_URL } from './api-url';
import { ACCESS_COOKIE } from './cookies';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ErrorPayload = { message?: string | string[] };

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  const rawMessage = (body as ErrorPayload | null)?.message;
  const message = Array.isArray(rawMessage)
    ? rawMessage.join(' ')
    : typeof rawMessage === 'string'
      ? rawMessage
      : 'Une erreur est survenue. Réessayez dans un instant.';
  return new ApiError(response.status, message, body);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}/${path.replace(/^\/+/, '')}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function apiFetchOrNull<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  try {
    return await apiFetch<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
