import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from '../../test-utils.js';

let app: FastifyInstance;

beforeEach(async () => {
  ({ app } = await createTestApp());
});

afterEach(async () => {
  await app.close();
});

const post = (body: unknown) =>
  app.inject({ method: 'POST', url: '/api/teams', payload: body as object });
const patch = (id: number | string, body: unknown) =>
  app.inject({ method: 'PATCH', url: `/api/teams/${id}`, payload: body as object });
const names = async (q = '') =>
  (await app.inject({ method: 'GET', url: `/api/teams${q}` }))
    .json()
    .map((t: { name: string }) => t.name);

describe('/api/teams', () => {
  it('creates and lists teams sorted by name', async () => {
    expect((await post({ name: 'Team Süd' })).statusCode).toBe(201);
    await post({ name: 'Team Nord' });
    expect(await names()).toEqual(['Team Nord', 'Team Süd']);
  });

  it('returns 400 with a German message for an empty name', async () => {
    const res = await post({ name: '' });
    expect(res.statusCode).toBe(400);
    expect(res.json().fields.name).toMatch(/Namen/);
  });

  it('returns 409 for a duplicate name', async () => {
    await post({ name: 'Team Nord' });
    const res = await post({ name: 'TEAM NORD' });
    expect(res.statusCode).toBe(409);
    expect(res.json().message).toMatch(/existiert bereits/);
  });

  it('renames and archives via PATCH', async () => {
    const { id } = (await post({ name: 'Team Nord' })).json();

    expect((await patch(id, { name: 'Team Nord-Ost' })).json().name).toBe('Team Nord-Ost');
    expect((await patch(id, { archived: true })).json().archived).toBe(true);
    expect(await names()).toEqual([]);
    expect(await names('?archived=all')).toEqual(['Team Nord-Ost']);
  });

  it('returns 404 and 400 for unknown or invalid ids', async () => {
    expect((await patch(999, { name: 'X' })).statusCode).toBe(404);
    expect((await patch('abc', { name: 'X' })).statusCode).toBe(400);
  });
});
