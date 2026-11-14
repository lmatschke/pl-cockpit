import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from './database.js';
import { runMigrations, MigrationError } from './migrate.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'plc-migrations-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function migration(name: string, sql: string) {
  writeFileSync(path.join(dir, name), sql);
}

function tableNames(db: ReturnType<typeof openDatabase>): string[] {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((row) => String(row.name));
}

describe('runMigrations', () => {
  it('returns version 0 when there are no migrations', () => {
    const db = openDatabase(':memory:');
    expect(runMigrations(db, dir)).toEqual({ schemaVersion: 0, applied: [] });
  });

  it('applies pending migrations in numeric order and records them', () => {
    migration(
      '002_b.sql',
      'CREATE TABLE b (id INTEGER PRIMARY KEY, a_id INTEGER REFERENCES a(id));',
    );
    migration('001_a.sql', 'CREATE TABLE a (id INTEGER PRIMARY KEY);');
    migration('README.txt', 'not a migration');
    const db = openDatabase(':memory:');

    const result = runMigrations(db, dir);

    expect(result).toEqual({ schemaVersion: 2, applied: ['001_a.sql', '002_b.sql'] });
    expect(tableNames(db)).toEqual(['a', 'b', 'schema_migrations']);
  });

  it('applies only new migrations on a second run', () => {
    migration('001_a.sql', 'CREATE TABLE a (id INTEGER PRIMARY KEY);');
    const db = openDatabase(':memory:');
    runMigrations(db, dir);

    migration('002_b.sql', 'CREATE TABLE b (id INTEGER PRIMARY KEY);');
    const result = runMigrations(db, dir);

    expect(result).toEqual({ schemaVersion: 2, applied: ['002_b.sql'] });
  });

  it('rolls back all pending migrations when one fails', () => {
    migration('001_a.sql', 'CREATE TABLE a (id INTEGER PRIMARY KEY);');
    migration('002_broken.sql', 'CREATE TABLE oops (;');
    const db = openDatabase(':memory:');

    expect(() => runMigrations(db, dir)).toThrow(MigrationError);
    expect(() => runMigrations(db, dir)).toThrow(/002_broken\.sql/);
    expect(tableNames(db)).toEqual(['schema_migrations']);
  });

  it('rejects duplicate version numbers', () => {
    migration('001_a.sql', 'CREATE TABLE a (id INTEGER PRIMARY KEY);');
    migration('001_b.sql', 'CREATE TABLE b (id INTEGER PRIMARY KEY);');
    const db = openDatabase(':memory:');

    expect(() => runMigrations(db, dir)).toThrow(/doppelt/i);
  });

  it('rejects a pending migration numbered below the latest applied one', () => {
    migration('001_a.sql', 'CREATE TABLE a (id INTEGER PRIMARY KEY);');
    migration('003_c.sql', 'CREATE TABLE c (id INTEGER PRIMARY KEY);');
    const db = openDatabase(':memory:');
    runMigrations(db, dir);

    migration('002_b.sql', 'CREATE TABLE b (id INTEGER PRIMARY KEY);');
    migration('004_d.sql', 'CREATE TABLE d (id INTEGER PRIMARY KEY);');

    expect(() => runMigrations(db, dir)).toThrow(MigrationError);
    expect(() => runMigrations(db, dir)).toThrow(/002_b\.sql.*Version 3/);
    expect(tableNames(db)).toEqual(['a', 'c', 'schema_migrations']);
  });

  it('treats a missing migrations directory as no migrations', () => {
    const db = openDatabase(':memory:');
    expect(runMigrations(db, path.join(dir, 'missing'))).toEqual({ schemaVersion: 0, applied: [] });
  });
});

describe('openDatabase', () => {
  it('enables foreign keys', () => {
    const db = openDatabase(':memory:');
    expect(db.prepare('PRAGMA foreign_keys').get()).toEqual({ foreign_keys: 1 });
  });

  it('creates the database file and its folder on disk', () => {
    const file = path.join(dir, 'nested', 'pl-cockpit.db');
    const db = openDatabase(file);
    db.exec('CREATE TABLE x (id INTEGER)');
    db.close();

    const reopened = openDatabase(file);
    expect(tableNames(reopened)).toEqual(['x']);
    reopened.close();
  });
});
