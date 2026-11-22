import { describe, expect, it } from 'vitest';

import { buildSecurityHeaders, contentSecurityPolicy } from '../src/shared/lib/security-headers';

function headerValue(name: string, isDevelopment = false): string | undefined {
  return buildSecurityHeaders(isDevelopment).find((header) => header.key === name)?.value;
}

describe('en-têtes de sécurité du front', () => {
  it('ferme le cadrage, le MIME et les permissions sensibles', () => {
    expect(headerValue('X-Frame-Options')).toBe('DENY');
    expect(headerValue('X-Content-Type-Options')).toBe('nosniff');
    expect(headerValue('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headerValue('Strict-Transport-Security')).toContain('max-age=31536000');
    expect(headerValue('Permissions-Policy')).toContain('camera=()');
    expect(headerValue('Permissions-Policy')).toContain('microphone=()');
    expect(headerValue('Permissions-Policy')).toContain('geolocation=()');
  });

  it('verrouille la CSP sans ouvrir de source externe', () => {
    const csp = contentSecurityPolicy(false);

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it('autorise l’évaluation uniquement en développement', () => {
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(true)).not.toContain('upgrade-insecure-requests');
  });
});
