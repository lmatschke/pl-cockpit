# Spec: core — V1

Status: Freigegeben (2026-11-14)
Root-Spec: [SPEC.md](SPEC.md) (erbt Stack, Befehle, Struktur, Stil, Tests, Grenzen)

## Ziel

Das Fundament für alle anderen Module: eine lauffähige App (Server + Web), die Datenbank mit
automatischem Migrations-Runner, die Navigation und die Stammdaten **Projekte** und **Teams**,
auf die sich Planung, Aufgaben und Risiken beziehen.

## Umfang

### App-Gerüst
- Navigation in einer linken Seitenleiste mit den Einträgen: **Start**, **Projektplanung**, **Aufgaben**, **Risiken**, **Weiterentwicklung**, **Stammdaten**.
  - Noch nicht gebaute Module zeigen eine Platzhalterseite („Noch nicht umgesetzt“).
- Startseite in core: Platzhalter, bis das Modul `tasks` die Ansicht „Heute / Diese Woche / Überfällig“ liefert.
- Deutsche Oberfläche; Datumsanzeige im Format `TT.MM.JJJJ`.
- Ausgelegt für Laptop-Bildschirme (≥ 1280 px Breite); mobil nicht erforderlich.

### Datenbank
- Öffnet bzw. erstellt die DB-Datei am Speicherort aus [SPEC.md](SPEC.md#datenablage); legt den Ordner bei Bedarf an.
- Beim Start werden alle ausstehenden nummerierten Migrationen aus `server/migrations/` in einer Transaktion angewendet, protokolliert in der Tabelle `schema_migrations`.
- Fremdschlüssel sind aktiviert.
- `GET /api/health` liefert `{ status: "ok", dbPath, schemaVersion }`.

### Stammdaten: Projekte

| Feld | Typ | Regeln |
|---|---|---|
| `id` | integer | Primärschlüssel |
| `name` | text | Pflicht, 1–120 Zeichen, eindeutig (ohne Groß-/Kleinschreibung) |
| `short_name` | text | optional, ≤ 12 Zeichen (z. B. „CRM-REL3“), wird in projektübergreifenden Ansichten angezeigt |
| `color` | text | Hex-Farbe, Standard aus fester Palette; für Zeitleisten |
| `description` | text | optional |
| `archived` | boolean | Standard false |
| `created_at`, `updated_at` | text | ISO-Zeitstempel |

- Anlegen, bearbeiten, archivieren / wiederherstellen. Archivierte Projekte sind standardmäßig in Auswahllisten und projektübergreifenden Ansichten ausgeblendet, bleiben aber in den Stammdaten unter „Archiviert“ sichtbar.
- **Kein echtes Löschen** in V1 (stattdessen archivieren). Das schützt die Historie von Anforderungen, Statusverläufen und Risiken.

### Stammdaten: Teams

| Feld | Typ | Regeln |
|---|---|---|
| `id` | integer | Primärschlüssel |
| `name` | text | Pflicht, 1–80 Zeichen, eindeutig (ohne Groß-/Kleinschreibung) |
| `archived` | boolean | Standard false |
| `created_at`, `updated_at` | text | ISO-Zeitstempel |

- Anlegen, umbenennen, archivieren / wiederherstellen. Kein echtes Löschen.
- Teams sind global (nicht pro Projekt); ein Team kann an Anforderungen mehrerer Projekte arbeiten.

### API

```
GET    /api/health
GET    /api/projects?archived=false|true|all   (Standard false)
POST   /api/projects
PATCH  /api/projects/:id                        (inkl. archived-Flag)
GET    /api/teams?archived=false|true|all       (Standard false)
POST   /api/teams
PATCH  /api/teams/:id
```

- Validierungsfehler → `400` mit `{ error: "validation", fields: { <feld>: <deutsche Meldung> } }`.
- Doppelter Name → `409` mit deutscher Meldung.
- Unbekannte ID → `404`.

### Projekt-Setup & Auslieferung
- Repo-Grundgerüst: `package.json` (npm-Workspaces oder ein Paket, Entscheidung beim Bauen, wird dokumentiert), `.nvmrc` (24), `engines`, `.gitattributes`, `.gitignore` (inkl. `*.db`), ESLint/Prettier, Vitest, Playwright.
- GitHub-Actions-Workflow: `npm run check` auf ubuntu-latest und windows-latest.
- `docs/setup-windows.md`: Node 24 installieren, klonen oder entpacken, `npm install`, `npm start`, Browser öffnen, Datenablage, Backup, Update per `git pull`.

## Erfolgskriterien

1. `npm start` liefert die App unter macOS und Windows auf `http://127.0.0.1:5179` aus; der Server ist über andere Netzwerkschnittstellen nicht erreichbar.
2. Der erste Start legt die DB-Datei am Standardort an; ein zweiter Start verwendet sie weiter und wendet nur neue Migrationen an.
3. `PL_COCKPIT_DATA_DIR` überschreibt den Speicherort.
4. Projekte: Anlegen, Bearbeiten, Archivieren, Wiederherstellen funktionieren in der Oberfläche; doppelte Namen werden mit einer verständlichen deutschen Meldung abgelehnt.
5. Teams: Anlegen, Umbenennen, Archivieren, Wiederherstellen funktionieren; doppelte Namen werden abgelehnt.
6. Archivierte Projekte/Teams erscheinen nicht in den Standardlisten, aber unter dem Filter „Archiviert“.
7. Alle Einträge der Seitenleiste sind erreichbar; nicht gebaute Module zeigen den Platzhalter.
8. `npm run check` ist lokal und in der CI auf beiden Betriebssystemen grün.
9. Das Repository enthält keine `.db`-Datei (abgesichert über `.gitignore`).

## E2E-Abläufe

- App öffnen → Stammdaten → Projekt „Test A“ anlegen → erscheint in der Liste → archivieren → in Standardliste ausgeblendet → unter „Archiviert“ sichtbar → wiederherstellen.
- Team „Team Nord“ anlegen → in „Team Nord-Ost“ umbenennen → weiteres Team „team nord-ost“ anlegen → Fehlermeldung erscheint.
- Alle Einträge der Seitenleiste durchklicken, ohne Fehler.

## Nicht im Umfang (core)

- Echtes Löschen, Import/Export von Stammdaten.
- Zusätzliche Projektfelder (Kunde, Start/Ende, Projektstatus); „abgeschlossen“ wird über Archivieren abgebildet. Kundenbezug kann in `description` stehen.
- Zusätzliche Teamfelder (z. B. Ansprechpartner); nur der Teamname wird gepflegt.
- Teamzuordnung pro Projekt (Teams werden in `planning` auf Ebene der Anforderung zugeordnet).

## Offene Fragen

- Keine.
