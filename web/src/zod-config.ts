import { z } from 'zod';

// The server's Content-Security-Policy forbids eval. Without jitless mode zod
// probes `new Function` and the browser reports a CSP violation.
// Imported first in main.tsx so it runs before any schema is used.
z.config({ jitless: true });
