/**
 * N'accepte que des chemins internes : évite les redirections ouvertes après
 * connexion (`next=//evil.example`).
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
}
