import { describe, expect, it } from 'vitest';
import { resolveDataDir, DB_FILE_NAME } from './data-dir.js';

describe('resolveDataDir', () => {
  it('uses PL_COCKPIT_DATA_DIR when set', () => {
    const dir = resolveDataDir({
      env: { PL_COCKPIT_DATA_DIR: '/custom/data', APPDATA: 'C:\\Users\\x\\AppData\\Roaming' },
      platform: 'win32',
      homeDir: 'C:\\Users\\x',
    });
    expect(dir).toBe('/custom/data');
  });

  it('uses %APPDATA%\\pl-cockpit on Windows', () => {
    const dir = resolveDataDir({
      env: { APPDATA: 'C:\\Users\\x\\AppData\\Roaming' },
      platform: 'win32',
      homeDir: 'C:\\Users\\x',
    });
    expect(dir).toBe('C:\\Users\\x\\AppData\\Roaming\\pl-cockpit');
  });

  it('falls back to the roaming profile on Windows when APPDATA is missing', () => {
    const dir = resolveDataDir({ env: {}, platform: 'win32', homeDir: 'C:\\Users\\x' });
    expect(dir).toBe('C:\\Users\\x\\AppData\\Roaming\\pl-cockpit');
  });

  it('uses ~/.pl-cockpit on macOS and Linux', () => {
    expect(resolveDataDir({ env: {}, platform: 'darwin', homeDir: '/Users/x' })).toBe(
      '/Users/x/.pl-cockpit',
    );
    expect(resolveDataDir({ env: {}, platform: 'linux', homeDir: '/home/x' })).toBe(
      '/home/x/.pl-cockpit',
    );
  });

  it('ignores an empty PL_COCKPIT_DATA_DIR', () => {
    const dir = resolveDataDir({
      env: { PL_COCKPIT_DATA_DIR: '' },
      platform: 'linux',
      homeDir: '/home/x',
    });
    expect(dir).toBe('/home/x/.pl-cockpit');
  });

  it('names the database file pl-cockpit.db', () => {
    expect(DB_FILE_NAME).toBe('pl-cockpit.db');
  });
});
