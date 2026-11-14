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
