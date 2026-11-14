import { expect, test } from '@playwright/test';

// Unique suffix so tests stay independent within one shared test database.
const uid = () => Math.random().toString(36).slice(2, 7);

test('navigate through all sidebar entries', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
  const entries = [
    ['Start', 'Start'],
    ['Projektplanung', 'Projektplanung'],
    ['Aufgaben', 'Aufgaben'],
    ['Risiken', 'Risiken'],
    ['Weiterentwicklung', 'Weiterentwicklung'],
    ['Stammdaten', 'Stammdaten'],
  ] as const;

  for (const [link, heading] of entries) {
    await nav.getByRole('link', { name: link }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
  await expect(page.getByText('Verbunden')).toBeVisible();
});

test('deep link survives a reload', async ({ page }) => {
  await page.goto('/risiken');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Risiken' })).toBeVisible();
});

test('create, archive and restore a project', async ({ page }) => {
  const name = `Test A ${uid()}`;
  await page.goto('/stammdaten');

  await page.getByRole('button', { name: 'Neues Projekt' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('Kürzel').fill('TA');
  await page.getByRole('button', { name: 'Projekt anlegen' }).click();

  const projects = page.getByRole('region', { name: 'Projekte' });
  await expect(projects.getByRole('cell', { name, exact: true })).toBeVisible();

  await projects.getByRole('button', { name: `${name} archivieren` }).click();
  await expect(page.getByRole('status')).toContainText('archiviert');
  await expect(projects.getByRole('cell', { name, exact: true })).toHaveCount(0);

  await projects.getByRole('button', { name: 'Archiviert' }).click();
  await expect(projects.getByRole('cell', { name, exact: true })).toBeVisible();

  await projects.getByRole('button', { name: `${name} wiederherstellen` }).click();
  await projects.getByRole('button', { name: 'Aktiv' }).click();
  await expect(projects.getByRole('cell', { name, exact: true })).toBeVisible();
});

test('duplicate project names are rejected with a message', async ({ page }) => {
  const name = `Duplikat ${uid()}`;
  await page.goto('/stammdaten');

  for (const attempt of [name, name.toUpperCase()]) {
    await page.getByRole('button', { name: 'Neues Projekt' }).click();
    await page.getByLabel('Name', { exact: true }).fill(attempt);
    await page.getByRole('button', { name: 'Projekt anlegen' }).click();
  }
  await expect(page.getByText('existiert bereits')).toBeVisible();
});

test('rename a team and reject a duplicate', async ({ page }) => {
  const id = uid();
  await page.goto('/stammdaten');
  const teams = page.getByRole('region', { name: 'Teams' });
  const input = teams.getByLabel('Name des neuen Teams');

  await input.fill(`Team Nord ${id}`);
  await input.press('Enter');
  await expect(teams.getByRole('cell', { name: `Team Nord ${id}`, exact: true })).toBeVisible();

  await teams.getByRole('button', { name: `Team Nord ${id} umbenennen` }).click();
  await teams.getByLabel(`Neuer Name für Team Nord ${id}`).fill(`Team Nord-Ost ${id}`);
  await teams.getByRole('button', { name: 'Speichern' }).click();
  await expect(teams.getByRole('cell', { name: `Team Nord-Ost ${id}`, exact: true })).toBeVisible();

  await input.fill(`team nord-ost ${id}`);
  await input.press('Enter');
  await expect(teams.getByText('existiert bereits')).toBeVisible();
});
