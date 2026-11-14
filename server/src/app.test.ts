import { describe, expect, it } from 'vitest';
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
