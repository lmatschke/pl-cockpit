import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { openDatabase } from './db/database.js';

describe('GET /api/health', () => {
  it('returns status, database path and schema version', async () => {
    const db = openDatabase(':memory:');
    const app = await buildApp({ db, dbPath: '/data/pl-cockpit.db', schemaVersion: 3 });
    const res = await app.inject({ method: 'GET', url: '/api/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', dbPath: '/data/pl-cockpit.db', schemaVersion: 3 });
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
    return buildApp({ db: openDatabase(':memory:'), dbPath: 'x', schemaVersion: 0, webDir });
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
