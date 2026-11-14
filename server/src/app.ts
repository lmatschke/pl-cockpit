import { existsSync } from 'node:fs';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';

export interface AppOptions {
  /** Directory of the built frontend; served when it exists. */
  webDir?: string;
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  app.get('/api/health', async () => ({ status: 'ok' }));

  if (options.webDir && existsSync(options.webDir)) {
    await app.register(fastifyStatic, { root: options.webDir });
  }

  return app;
}
