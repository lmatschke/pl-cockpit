import path from 'node:path';
import { buildApp } from './app.js';
import { openDatabase, type Database } from './db/database.js';
import { runMigrations } from './db/migrate.js';

export const MIGRATIONS_DIR = path.resolve('server', 'migrations');

/** Fresh in-memory database with all real migrations applied. */
export function createTestDb(): Database {
  const db = openDatabase(':memory:');
  runMigrations(db, MIGRATIONS_DIR);
  return db;
}

/** App instance backed by a fresh in-memory database. */
export async function createTestApp() {
  const db = createTestDb();
  const app = await buildApp({ db, dbPath: ':memory:', schemaVersion: 1 });
  return { app, db };
}
