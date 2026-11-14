import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { openDatabase } from './db/database.js';
import { createTestDb } from './test-utils.js';

describe('GET /api/health', () => {
  it('returns status and schema version, but not the database path', async () => {
    const db = openDatabase(':memory:');
    const app = await buildApp({ db, schemaVersion: 3 });
    const res = await app.inject({ method: 'GET', url: '/api/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', schemaVersion: 3 });
    await app.close();
  });
});

describe('serving the frontend', () => {
  let webDir: string;

  beforeAll(() => {
    webDir = mkdtempSync(path.join(tmpdir(), 'plc-web-'));
    writeFileSync(path.join(webDir, 'index.html'), '<!doctype html><title>PL-Cockpit</title>');
  });

  afterAll(() => rmSync(webDir, { recursive: true, force: true }));

  async function app() {
    return buildApp({ db: openDatabase(':memory:'), schemaVersion: 0, webDir });
  }

  it('serves index.html for client-side routes (SPA fallback)', async () => {
    const res = await (await app()).inject({ method: 'GET', url: '/stammdaten' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.body).toContain('PL-Cockpit');
  });

  it('answers unknown API routes with a JSON 404 instead of the page', async () => {
    const res = await (await app()).inject({ method: 'GET', url: '/api/gibt-es-nicht' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: 'not_found', message: 'Nicht gefunden' });
  });
});

describe('request hardening', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ db: createTestDb(), schemaVersion: 1 });
  });

  afterAll(() => app.close());

  it.each(['127.0.0.1:5179', 'localhost:5179', 'localhost', '127.0.0.1:5173'])(
    'accepts the local host %s',
    async (host) => {
      const res = await app.inject({ method: 'GET', url: '/api/health', headers: { host } });
      expect(res.statusCode).toBe(200);
    },
  );

  it.each([
    'attacker.example:5179',
    'attacker.example',
    '192.168.1.20:5179',
    'localhost.attacker.example',
  ])('rejects a foreign host %s (DNS rebinding)', async (host) => {
    const res = await app.inject({ method: 'GET', url: '/api/projects', headers: { host } });
    expect(res.statusCode).toBe(421);
    expect(res.json()).toMatchObject({ error: 'misdirected' });
  });

  it('rejects writes from a foreign origin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: { origin: 'https://attacker.example' },
      payload: { name: 'Fremd' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ error: 'forbidden' });
    const list = await app.inject({ method: 'GET', url: '/api/projects' });
    expect(list.json()).toEqual([]);
  });

  it.each(['null', 'not a url'])('rejects writes with an unusable origin %s', async (origin) => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/teams',
      headers: { origin },
      payload: { name: 'X' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('accepts writes from the own origin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/teams',
      headers: { host: '127.0.0.1:5179', origin: 'http://127.0.0.1:5179' },
      payload: { name: 'Eigenes Team' },
    });
    expect(res.statusCode).toBe(201);
  });

  it('rejects non-JSON bodies with 415', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/teams',
      headers: { 'content-type': 'text/plain' },
      payload: '{"name":"Text"}',
    });
    expect(res.statusCode).toBe(415);
  });

  it('sets security headers on API and page responses', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('sets security headers on rejected requests too', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
      headers: { host: 'attacker.example' },
    });
    expect(res.headers['x-frame-options']).toBe('DENY');
  });
});
