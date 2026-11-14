import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { archivedFilterSchema, idParamSchema } from '../../../../shared/schemas/core.js';
import type { TeamRepository } from './team-repository.js';

const listQuerySchema = z.object({ archived: archivedFilterSchema });

export function registerTeamRoutes(app: FastifyInstance, repo: TeamRepository) {
  app.get('/api/teams', async (req) => {
    const { archived } = listQuerySchema.parse(req.query ?? {});
    return repo.list({ archived });
  });

  app.post('/api/teams', async (req, reply) => reply.code(201).send(repo.create(req.body)));

  app.patch('/api/teams/:id', async (req) => {
    const { id } = idParamSchema.parse(req.params);
    return repo.update(id, req.body);
  });
}
