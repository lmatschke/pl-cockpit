// Starts the built app with a fresh, throw-away data directory for E2E tests.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.PL_COCKPIT_DATA_DIR = mkdtempSync(path.join(tmpdir(), 'plc-e2e-'));
process.env.PL_COCKPIT_PORT ??= '5181';

await import(pathToFileURL(path.resolve('dist/node/server/src/main.js')).href);
