import os from 'node:os';
import path from 'node:path';
import { buildApp } from './app.js';
import { openDatabase } from './db/database.js';
import { DB_FILE_NAME, resolveDataDir } from './db/data-dir.js';
import { runMigrations } from './db/migrate.js';

const HOST = '127.0.0.1';
const port = Number(process.env.PL_COCKPIT_PORT ?? 5179);
const appRoot = process.env.PL_COCKPIT_APP_DIR ?? process.cwd();

try {
  const dataDir = resolveDataDir({
    env: process.env,
    platform: process.platform,
    homeDir: os.homedir(),
  });
  const dbPath = path.join(dataDir, DB_FILE_NAME);
  const db = openDatabase(dbPath);
  const { schemaVersion, applied } = runMigrations(db, path.join(appRoot, 'server', 'migrations'));

  const app = await buildApp({
    db,
    dbPath,
    schemaVersion,
    webDir: path.join(appRoot, 'dist', 'web'),
  });
  app.addHook('onClose', async () => db.close());

  await app.listen({ host: HOST, port });
  console.log(`Datenbank: ${dbPath} (Schema-Version ${schemaVersion})`);
  if (applied.length > 0) console.log(`Neue Migrationen angewendet: ${applied.join(', ')}`);
  console.log(`PL-Cockpit läuft auf http://${HOST}:${port}`);
} catch (err) {
  console.error('PL-Cockpit konnte nicht gestartet werden:');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
