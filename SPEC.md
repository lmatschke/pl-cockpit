# Spec: PL-Cockpit — V1

Status: Freigegeben (2026-11-14)
Intent: [docs/intent/pl-cockpit.md](docs/intent/pl-cockpit.md)

Diese Datei ist die Root-Spec: Ziel, Modulkarte und die übergreifenden Regeln (Stack, Befehle,
Struktur, Stil, Tests, Grenzen), die jedes Modul erbt. Jedes Modul hat eine eigene Spec
`SPEC-<modul-id>.md` neben dieser Datei.

## Ziel

Ein persönliches Cockpit für einen IT-Projektleiter (Einzelnutzer) mit vielen parallelen Projekten.
Es läuft lokal als Web-App und beantwortet jeden Morgen zwei Fragen:

1. *Was muss ich heute / diese Woche tun, und was ist überfällig?* (eigene PL-Pflichten)
2. *Welche Anforderungen müssen meine Entwicklungsteams wann liefern, über alle Projekte hinweg, und wie ist der aktuelle Stand?*

Es ergänzt Azure DevOps (Boards), SharePoint (Doku) und das bestehende Reporting-Tool, ersetzt sie aber nicht.

## Modulkarte

| Modul-ID | Verantwortung | Hängt ab von | Spec |
|---|---|---|---|
| `core` | App-Gerüst, Datenbank + Migrationen, Navigation, Stammdaten (Projekte, Teams) | — | [SPEC-core.md](SPEC-core.md) |
| `devstatus` | „Weiterentwicklung“: liest die Plandateien in `tasks/` aus dem Repo, zeigt Features → Aufgaben → Status/Fortschritt | core | [SPEC-devstatus.md](SPEC-devstatus.md) |
| `planning` | Anforderungen, Phasen (Konzeption, Entwicklung, MTS, ABN, Golive) mit Terminen je Team, Statusverlauf, Listen- und Zeitleistenansicht (übergreifend / pro Projekt / pro Team) | core | [SPEC-planning.md](SPEC-planning.md) |
| `tasks` | Wiederkehrende und einmalige PL-Aufgaben, optional einem Projekt zugeordnet, Startseite „Heute / Diese Woche / Überfällig“ (inkl. fälliger Liefertermine aus planning) | core, planning | [SPEC-tasks.md](SPEC-tasks.md) |
| `risks` | Risikoregister je Projekt (Wahrscheinlichkeit × Auswirkung, Maßnahme, Verantwortlicher, Status); Review-Erinnerung über eine wiederkehrende Aufgabe | core, tasks | [SPEC-risks.md](SPEC-risks.md) |

Reihenfolge: **core → devstatus → planning → tasks → risks**

Modul-IDs sind stabil und werden nicht umbenannt.

## Tech-Stack

| Bereich | Wahl | Begründung |
|---|---|---|
| Laufzeit | Node.js **24 LTS** (festgelegt über `.nvmrc` und `engines`) | Gleiche Version auf macOS (Entwicklung) und Windows (Zielrechner) |
| Sprache | TypeScript (strict) | Eine Sprache für Frontend und Backend |
| Backend | Fastify | Klein, typisiert, gut testbar über `inject()` |
| Datenbank | SQLite über das eingebaute **`node:sqlite`** | Kein nativer Build-Schritt → installiert sich unter Windows ohne Build-Tools |
| Frontend | React + Vite | Standard, schneller Entwicklungszyklus |
| Zeitleiste | Eigene SVG-Komponente | Keine Abhängigkeiten nötig (keine Pfeile, kein kritischer Pfad) |
| Validierung | zod (gemeinsame Schemas für API + UI) | Eine Quelle für Eingaberegeln |
| Unit-/API-Tests | Vitest | Schnell, TypeScript-nativ |
| E2E-Tests | Playwright (Chromium) | Kritische Nutzerabläufe |

Jede weitere Laufzeit-Abhängigkeit außerhalb dieser Liste braucht eine Freigabe (siehe Grenzen).

## Plattformanforderungen (Zielrechner Windows)

Entwickelt wird auf macOS; die App muss auf dem Windows-Firmenlaptop **ohne Codeänderungen** laufen:

- `git clone` (oder ZIP) → `npm install` → `npm start` funktioniert unter Windows, wenn nur Node 24 installiert ist.
- Keine nativen npm-Module (kein node-gyp / keine Visual Studio Build Tools).
- npm-Skripte ohne shell-spezifische Syntax (kein `rm -rf`, kein `export`, keine Umgebungsvariablen per `VAR=x cmd`); stattdessen Node-Skripte oder plattformneutrale Pakete.
- Dateipfade immer über `node:path`, nie fest verdrahtete Trennzeichen.
- `.gitattributes` erzwingt LF-Zeilenenden im Repo.
- CI (GitHub Actions) führt Typecheck, Lint und Tests auf **ubuntu-latest und windows-latest** aus.
- `docs/setup-windows.md` beschreibt Installation und Start in höchstens 10 Schritten.

## Datenablage

- Die SQLite-Datenbank liegt **außerhalb des Repositorys**:
  - Windows: `%APPDATA%\pl-cockpit\pl-cockpit.db`
  - macOS/Linux: `~/.pl-cockpit/pl-cockpit.db`
  - Überschreibbar über die Umgebungsvariable `PL_COCKPIT_DATA_DIR`.
- Backup = diese eine Datei kopieren (in der Setup-Anleitung beschrieben).
- Kundendaten gelangen nie ins Git-Repository.

## Befehle

```
npm install            # Abhängigkeiten installieren
npm run dev            # Backend (watch) + Vite-Dev-Server
npm start              # bei Bedarf bauen, dann App auf http://localhost:5179 starten
npm run build          # Frontend + Backend bauen
npm test               # Vitest (Unit + API)
npm run test:e2e       # Playwright E2E
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit für alle Teilprojekte
npm run check          # typecheck + lint + test (vor jedem Commit)
```

Der Server lauscht nur auf `127.0.0.1`. Port über `PL_COCKPIT_PORT` konfigurierbar.

## Projektstruktur

```
server/                → Fastify-App, DB-Zugriff, Migrationen
  src/modules/<id>/    → Routen + Repository je Modul-ID
  src/db/              → Verbindung, Migrations-Runner
  migrations/          → nummerierte SQL-Migrationen (001_core.sql, …)
web/                   → React-App (Vite)
  src/modules/<id>/    → Seiten + Komponenten je Modul-ID
  src/shared/          → Layout, UI-Grundbausteine, API-Client
shared/                → zod-Schemas + Typen für Server und Web
e2e/                   → Playwright-Tests
tasks/                 → plan.md, todo.md (werden vom Modul devstatus gelesen)
docs/                  → Intent, setup-windows.md, ADRs
SPEC.md, SPEC-<id>.md  → Specs
```

Tests liegen neben dem getesteten Code (`*.test.ts`), E2E-Tests in `e2e/`.

## Code-Stil

- TypeScript strict, ESLint + Prettier-Standards, 2 Leerzeichen Einrückung.
- Code, Bezeichner, Kommentare, Commits: **Englisch**. UI-Texte und Specs: **Deutsch**.
- Dateien `kebab-case.ts`, React-Komponenten `PascalCase.tsx`, DB-Tabellen/-Spalten `snake_case`.
- Datumswerte als ISO-String `YYYY-MM-DD` (reine Daten, keine Zeitzonen).
- Eingaben werden an der API-Grenze mit gemeinsamen zod-Schemas validiert.

```ts
// server/src/modules/core/project-routes.ts
export function registerProjectRoutes(app: FastifyInstance, repo: ProjectRepository) {
  app.post('/api/projects', async (req, reply) => {
    const input = projectCreateSchema.parse(req.body);
    const project = repo.create(input);
    return reply.code(201).send(project);
  });
}
```

## Teststrategie

- **Repository-/Domänenlogik:** Vitest gegen eine In-Memory-SQLite (`:memory:`), frisch pro Test.
- **API:** Vitest mit `app.inject()`: Statuscodes, Validierungsfehler, Normalfälle.
- **UI:** abgedeckt durch Playwright-E2E für die Kernabläufe jedes Moduls (keine Snapshot-Tests).
- **Abdeckungsziel:** ≥ 80 % Zeilen für `server/` und `shared/`; UI über E2E-Abläufe.
- Bugs werden test-first behoben (fehlschlagender Test reproduziert den Bug, dann Fix).
- Jede Modul-Spec listet ihre E2E-Abläufe.

## Grenzen

- **Immer:**
  - `npm run check` vor jedem Commit ausführen.
  - Tests zusammen mit jedem Feature schreiben.
  - Windows-Kompatibilität wahren (siehe Plattformanforderungen).
  - Nach jeder abgeschlossenen Aufgabe den Status in `tasks/todo.md` aktualisieren (Datenquelle für devstatus).
  - DB-Änderungen als neue nummerierte Migration; angewandte Migrationen nie bearbeiten.
- **Vorher fragen:**
  - Neue Laufzeit-Abhängigkeit, die nicht im Tech-Stack steht.
  - Änderung am DB-Schema eines bereits gebauten Moduls.
  - Änderung an Modulgrenzen oder Reihenfolge.
  - Alles, was den Server außerhalb von `localhost` erreichbar machen würde.
- **Niemals:**
  - Datenbankdatei, Exporte oder echte Kunden-/Projektdaten committen (auch nicht als Testdaten).
  - Native npm-Module verwenden.
  - Fehlschlagende Tests ohne Freigabe entfernen oder überspringen.
  - Netzwerkaufrufe zu externen Diensten einbauen (V1 ist komplett offline).

## Erfolgskriterien (V1, gesamt)

- Auf einem frischen Windows-Rechner mit Node 24: clone → `npm install` → `npm start` → App öffnet sich im Browser, ohne Fehler.
- Alle fünf Module sind gemäß ihrer Modul-Specs umgesetzt, ihre E2E-Abläufe sind grün.
- CI ist grün auf ubuntu-latest und windows-latest.
- Nach einem App-Update (`git pull`) bleiben vorhandene Daten erhalten, Migrationen laufen automatisch.

## Nicht im Umfang (zurückgestellt)

- Azure-DevOps-Anbindung (Import von Anforderungen / Status): sobald die Anforderungen 2027 in DevOps liegen; das Datenmodell sieht ein Feld `devops_id` vor.
- E-Mail-/Outlook-Erinnerungen: V1 erinnert über die Startseite.
- Mehrbenutzer, Login, Server-Hosting: Einzelnutzer, nur lokal.
- Abhängigkeiten zwischen Anforderungen, kritischer Pfad, Kapazitätsplanung: nicht benötigt.
- Export ins Reporting-Tool: Reporting bleibt separat.

## Offene Fragen

- Keine für die Root-Spec. Modulspezifische Fragen stehen in der jeweiligen Modul-Spec.
