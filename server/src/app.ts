import { existsSync } from 'node:fs';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import type { Database } from './db/database.js';
import { registerErrorHandler } from './http-errors.js';
import { ProjectRepository } from './modules/core/project-repository.js';
import { registerProjectRoutes } from './modules/core/project-routes.js';

export interface AppOptions {
  db: Database;
  dbPath: string;
  schemaVersion: number;
  /** Directory of the built frontend; served when it exists. */
  webDir?: string;
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  registerErrorHandler(app);

  app.get('/api/health', async () => ({
    status: 'ok',
    dbPath: options.dbPath,
    schemaVersion: options.schemaVersion,
  }));

  registerProjectRoutes(app, new ProjectRepository(options.db));

  const serveWeb = options.webDir !== undefined && existsSync(options.webDir);
  if (serveWeb) {
    await app.register(fastifyStatic, { root: options.webDir! });
  }

  app.setNotFoundHandler((req, reply) => {
    if (serveWeb && req.method === 'GET' && !req.url.startsWith('/api/')) {
      // Client-side routes (e.g. /stammdaten) are resolved by the React router.
      return reply.type('text/html').sendFile('index.html');
    }
    return reply.code(404).send({ error: 'not_found', message: 'Nicht gefunden' });
  });

  return app;
}
