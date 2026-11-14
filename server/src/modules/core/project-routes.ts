import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { archivedFilterSchema } from '../../../../shared/schemas/core.js';
import type { ProjectRepository } from './project-repository.js';

const listQuerySchema = z.object({ archived: archivedFilterSchema });

export function registerProjectRoutes(app: FastifyInstance, repo: ProjectRepository) {
  app.get('/api/projects', async (req) => {
    const { archived } = listQuerySchema.parse(req.query ?? {});
    return repo.list({ archived });
  });

  app.post('/api/projects', async (req, reply) => {
    const project = repo.create(req.body);
    return reply.code(201).send(project);
  });
}
