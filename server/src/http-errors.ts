import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

export class ConflictError extends Error {
  override name = 'ConflictError';
}

export class NotFoundError extends Error {
  override name = 'NotFoundError';
}

function zodFields(err: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  return fields;
}

/** Maps domain and validation errors to the JSON error format from SPEC-core. */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply
        .code(400)
        .send({ error: 'validation', message: 'Bitte Eingaben prüfen.', fields: zodFields(err) });
    }
    if (err instanceof ConflictError) {
      return reply.code(409).send({ error: 'conflict', message: err.message });
    }
    if (err instanceof NotFoundError) {
      return reply.code(404).send({ error: 'not_found', message: err.message });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.code(status).send({ error: 'bad_request', message: 'Ungültige Anfrage.' });
    }
    console.error(err);
    return reply.code(500).send({ error: 'internal', message: 'Interner Fehler.' });
  });
}
