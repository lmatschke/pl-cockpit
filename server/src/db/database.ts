import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Database = DatabaseSync;

/** Opens (or creates) the SQLite database; creates the parent folder if needed. */
export function openDatabase(file: string): Database {
  if (file !== ':memory:') {
    mkdirSync(path.dirname(file), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}
