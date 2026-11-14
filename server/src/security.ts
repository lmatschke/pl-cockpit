import type { FastifyInstance } from 'fastify';

/** Hostnames the local server answers to. The port is irrelevant for DNS rebinding. */
const LOCAL_HOSTNAMES = new Set(['127.0.0.1', 'localhost']);

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
} as const;

function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function isLocalHost(hostHeader: string | undefined): boolean {
  if (!hostHeader) return false;
  return LOCAL_HOSTNAMES.has(hostnameOf(`http://${hostHeader}`) ?? '');
}

function isLocalOrigin(origin: string): boolean {
  return LOCAL_HOSTNAMES.has(hostnameOf(origin) ?? '');
}

/**
 * Protects the localhost-only server against browser-based attacks:
 * DNS rebinding (foreign Host), cross-site writes (foreign Origin), non-JSON
 * bodies (simple-request CSRF) and framing / MIME sniffing (response headers).
 */
export function registerSecurity(app: FastifyInstance) {
  // Only JSON request bodies; text/plain would allow CSRF via "simple" requests.
  app.removeContentTypeParser('text/plain');

  app.addHook('onRequest', async (req, reply) => {
    reply.headers(SECURITY_HEADERS);

    if (!isLocalHost(req.headers.host)) {
      return reply.code(421).send({
        error: 'misdirected',
        message: 'Unbekannter Host. Bitte über 127.0.0.1 aufrufen.',
      });
    }

    const origin = req.headers.origin;
    if (req.method !== 'GET' && req.method !== 'HEAD' && origin !== undefined) {
      if (!isLocalOrigin(origin)) {
        return reply
          .code(403)
          .send({ error: 'forbidden', message: 'Anfrage von fremder Seite abgelehnt.' });
      }
    }
  });
}
