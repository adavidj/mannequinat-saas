import helmet, { type HelmetOptions } from 'helmet';

/**
 * En-têtes de sécurité de l'API.
 *
 * L'API sert du JSON au BFF et une interface Swagger sur `/api/docs`. La CSP
 * autorise donc les scripts et styles inline nécessaires à Swagger, tout en
 * fermant le cadrage, les objets embarqués et les sources externes. HSTS n'est
 * activé qu'en production, une fois le HTTPS garanti par le reverse proxy.
 */
export function securityHeadersOptions(
  nodeEnv: string = process.env.NODE_ENV ?? 'development',
): HelmetOptions {
  const isProduction = nodeEnv === 'production';

  return {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    hsts: isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    noSniff: true,
    hidePoweredBy: true,
  };
}

export function securityHeadersMiddleware(nodeEnv?: string) {
  return helmet(securityHeadersOptions(nodeEnv));
}
