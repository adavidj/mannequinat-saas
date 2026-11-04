export class BrowserApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BrowserApiError';
  }
}

type ErrorPayload = { message?: string | string[] };

async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const rawMessage = (body as ErrorPayload | null)?.message;
  if (Array.isArray(rawMessage)) {
    return rawMessage.join(' ');
  }
  return typeof rawMessage === 'string'
    ? rawMessage
    : 'Une erreur est survenue. Réessayez dans un instant.';
}

/**
 * Appelle l'API à travers le proxy BFF `/api/proxy/*`. Le jeton d'accès reste
 * dans un cookie HttpOnly : le navigateur n'y a jamais accès.
 */
export async function browserApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }
  headers.set('accept', 'application/json');

  const response = await fetch(`/api/proxy/${path.replace(/^\/+/, '')}`, {
    ...init,
    headers,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new BrowserApiError(response.status, await readErrorMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function browserApiMessage(error: unknown): string {
  if (error instanceof BrowserApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Une erreur est survenue. Réessayez dans un instant.';
}
