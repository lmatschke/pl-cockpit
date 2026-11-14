import { describe, expect, it } from 'vitest';
import { startupErrorMessage } from './startup-error.js';

describe('startupErrorMessage', () => {
  it('explains an occupied port in German', () => {
    const err = Object.assign(new Error('listen EADDRINUSE: address already in use'), {
      code: 'EADDRINUSE',
    });
    const msg = startupErrorMessage(err, 5179);

    expect(msg).toContain('Port 5179 ist bereits belegt');
    expect(msg).toContain('PL_COCKPIT_PORT');
  });

  it('passes through other error messages', () => {
    expect(startupErrorMessage(new Error('Migration 002_x.sql fehlgeschlagen'), 5179)).toBe(
      'Migration 002_x.sql fehlgeschlagen',
    );
    expect(startupErrorMessage('kaputt', 5179)).toBe('kaputt');
  });
});
