import { existsSync } from 'node:fs';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import type { Database } from './db/database.js';

export interface AppOptions {
  db: Database;
  dbPath: string;
  schemaVersion: number;
  /** Directory of the built frontend; served when it exists. */
  webDir?: string;
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  app.get('/api/health', async () => ({
    status: 'ok',
    dbPath: options.dbPath,
    schemaVersion: options.schemaVersion,
  }));

  if (options.webDir && existsSync(options.webDir)) {
    await app.register(fastifyStatic, { root: options.webDir });
  }

  return app;
}
