import path from 'node:path';
import { buildApp } from './app.js';

const HOST = '127.0.0.1';
const port = Number(process.env.PL_COCKPIT_PORT ?? 5179);
const appRoot = process.env.PL_COCKPIT_APP_DIR ?? process.cwd();

const app = await buildApp({ webDir: path.join(appRoot, 'dist', 'web') });

try {
  await app.listen({ host: HOST, port });
  console.log(`PL-Cockpit läuft auf http://${HOST}:${port}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
