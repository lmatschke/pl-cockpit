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

function post(body: unknown) {
  return app.inject({ method: 'POST', url: '/api/projects', payload: body as object });
}

describe('POST /api/projects', () => {
  it('creates a project and returns 201', async () => {
    const res = await post({ name: '  CRM Release 3 ', shortName: 'CRM-R3', description: '' });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      name: 'CRM Release 3',
      shortName: 'CRM-R3',
      description: null,
      archived: false,
    });
  });

  it('returns 400 with German field messages for invalid input', async () => {
    const res = await post({ name: '', shortName: 'VIEL-ZU-LANGES-KUERZEL', color: 'rot' });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('validation');
    expect(Object.keys(body.fields).sort()).toEqual(['color', 'name', 'shortName']);
    expect(body.fields.name).toMatch(/Namen/);
  });

  it('returns 400 when the body is missing', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/projects' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('validation');
  });

  it('returns 409 with a German message for a duplicate name', async () => {
    await post({ name: 'CRM' });
    const res = await post({ name: 'crm' });

    expect(res.statusCode).toBe(409);
    expect(res.json().message).toMatch(/existiert bereits/);
  });
});

describe('GET /api/projects', () => {
  it('lists created projects', async () => {
    await post({ name: 'B' });
    await post({ name: 'A' });

    const res = await app.inject({ method: 'GET', url: '/api/projects' });

    expect(res.statusCode).toBe(200);
    expect(res.json().map((p: { name: string }) => p.name)).toEqual(['A', 'B']);
  });

  it('rejects an invalid archived filter', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects?archived=vielleicht' });
    expect(res.statusCode).toBe(400);
  });
});

describe('PATCH /api/projects/:id', () => {
  function patch(id: number | string, body: unknown) {
    return app.inject({ method: 'PATCH', url: `/api/projects/${id}`, payload: body as object });
  }

  it('updates and returns the project', async () => {
    const { id } = (await post({ name: 'CRM' })).json();
    const res = await patch(id, { name: 'CRM Release 3', archived: true });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ id, name: 'CRM Release 3', archived: true });
  });

  it('returns 404 for an unknown id', async () => {
    const res = await patch(999, { name: 'X' });
    expect(res.statusCode).toBe(404);
    expect(res.json().message).toMatch(/nicht gefunden/i);
  });

  it('returns 400 for a non-numeric id', async () => {
    expect((await patch('abc', { name: 'X' })).statusCode).toBe(400);
  });

  it('returns 400 for invalid fields', async () => {
    const { id } = (await post({ name: 'CRM' })).json();
    const res = await patch(id, { name: '', archived: 'ja' });

    expect(res.statusCode).toBe(400);
    expect(Object.keys(res.json().fields).sort()).toEqual(['archived', 'name']);
  });

  it('lists archived projects only with the matching filter', async () => {
    const { id } = (await post({ name: 'Alt' })).json();
    await post({ name: 'Neu' });
    await patch(id, { archived: true });

    const names = async (q: string) =>
      (await app.inject({ method: 'GET', url: `/api/projects${q}` }))
        .json()
        .map((p: { name: string }) => p.name);

    expect(await names('')).toEqual(['Neu']);
    expect(await names('?archived=true')).toEqual(['Alt']);
    expect(await names('?archived=all')).toEqual(['Alt', 'Neu']);
  });
});
