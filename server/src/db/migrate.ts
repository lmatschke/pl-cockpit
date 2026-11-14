import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from './database.js';

const MIGRATION_FILE = /^(\d+)_[\w-]+\.sql$/;

export interface MigrationResult {
  schemaVersion: number;
  applied: string[];
}

export class MigrationError extends Error {
  override name = 'MigrationError';
}

interface MigrationFile {
  version: number;
  name: string;
}

function listMigrations(dir: string): MigrationFile[] {
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir)
    .map((name) => ({ name, match: MIGRATION_FILE.exec(name) }))
    .filter((f): f is { name: string; match: RegExpExecArray } => f.match !== null)
    .map((f) => ({ version: Number(f.match[1]), name: f.name }))
    .sort((a, b) => a.version - b.version);

  for (let i = 1; i < files.length; i++) {
    if (files[i]!.version === files[i - 1]!.version) {
      throw new MigrationError(
        `Migrationsnummer ${files[i]!.version} ist doppelt vergeben (${files[i - 1]!.name}, ${files[i]!.name}).`,
      );
    }
  }
  return files;
}

/**
 * Applies all pending numbered migrations in a single transaction.
 * If any migration fails, none of the pending ones are applied.
 */
export function runMigrations(db: Database, dir: string): MigrationResult {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  )`);

  const done = new Set(
    db
      .prepare('SELECT version FROM schema_migrations')
      .all()
      .map((row) => Number(row.version)),
  );
  const pending = listMigrations(dir).filter((m) => !done.has(m.version));
  const latestApplied = Math.max(0, ...done);
  const outOfOrder = pending.find((m) => m.version < latestApplied);
  if (outOfOrder) {
    throw new MigrationError(
      `Migration ${outOfOrder.name} hat eine niedrigere Nummer als die bereits angewendete Version ${latestApplied}. ` +
        'Neue Migrationen müssen eine höhere Nummer bekommen.',
    );
  }
  const applied: string[] = [];

  if (pending.length > 0) {
    const record = db.prepare(
      'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
    );
    db.exec('BEGIN');
    let current = '';
    try {
      for (const m of pending) {
        current = m.name;
        db.exec(readFileSync(path.join(dir, m.name), 'utf8'));
        record.run(m.version, m.name, new Date().toISOString());
        applied.push(m.name);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      const reason = err instanceof Error ? err.message : String(err);
      throw new MigrationError(`Migration ${current} fehlgeschlagen: ${reason}`, { cause: err });
    }
  }

  const row = db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get();
  return { schemaVersion: Number(row?.v ?? 0), applied };
}
