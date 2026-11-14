import path from 'node:path';

export const DB_FILE_NAME = 'pl-cockpit.db';
const APP_FOLDER = 'pl-cockpit';

export interface DataDirInput {
  env: Record<string, string | undefined>;
  platform: NodeJS.Platform;
  homeDir: string;
}

/** Folder that holds the SQLite database. Always outside the repository. */
export function resolveDataDir({ env, platform, homeDir }: DataDirInput): string {
  const override = env.PL_COCKPIT_DATA_DIR;
  if (override) return override;

  if (platform === 'win32') {
    const appData = env.APPDATA || path.win32.join(homeDir, 'AppData', 'Roaming');
    return path.win32.join(appData, APP_FOLDER);
  }
  return path.posix.join(homeDir, `.${APP_FOLDER}`);
}
