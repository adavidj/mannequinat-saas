import { createServer, type Server } from 'node:http';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { securityHeadersMiddleware, securityHeadersOptions } from '../src/config/security-headers';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const middleware = securityHeadersMiddleware('production');

  server = createServer((request, response) => {
    middleware(request, response, () => {
      response.setHeader('content-type', 'application/json');
      response.end('{"ok":true}');
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('en-têtes de sécurité de l’API', () => {
  it('ferme le cadrage, le type MIME et les sources de la CSP', async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('x-powered-by')).toBeNull();

    const csp = response.headers.get('content-security-policy') ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it('active HSTS uniquement en production', async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.headers.get('strict-transport-security')).toContain('max-age=31536000');

    expect(securityHeadersOptions('production').hsts).toMatchObject({ maxAge: 31_536_000 });
    expect(securityHeadersOptions('development').hsts).toBe(false);
  });
});
