# Umsetzungsplan: PL-Cockpit — V1

Quell-Specs: [SPEC.md](../SPEC.md), [SPEC-core.md](../SPEC-core.md), [SPEC-devstatus.md](../SPEC-devstatus.md),
[SPEC-planning.md](../SPEC-planning.md), [SPEC-tasks.md](../SPEC-tasks.md), [SPEC-risks.md](../SPEC-risks.md)

Aufgabenliste (Status, wird vom Modul devstatus gelesen): [todo.md](todo.md)

## Überblick

Fünf Module in der Reihenfolge der Modulkarte: **core → devstatus → planning → tasks → risks**.
Jede Aufgabe ist ein vertikaler Schnitt (DB → API → UI → Tests) und hinterlässt eine lauffähige App.
Nach jedem Modul gibt es einen Checkpoint mit Rückmeldung an dich.

## Architekturentscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| A1 | **Ein npm-Paket** (keine Workspaces), drei TypeScript-Projekte `server/`, `web/`, `shared/` über `tsconfig`-Referenzen | Am wenigsten fehleranfällig unter Windows; ein `npm install` |
| A2 | `npm start` baut immer (Vite + tsc, wenige Sekunden) und startet dann `node dist/server/main.js`; der Server liefert das gebaute Frontend selbst aus | Ein Befehl, ein Prozess, ein Port |
| A3 | `npm run dev`: Fastify per `tsx watch` + Vite-Dev-Server mit Proxy auf `/api`, gestartet über `concurrently` | Plattformneutral (keine Shell-Syntax) |
| A4 | DB-Zugriff über **dünne Repository-Klassen** je Modul mit Prepared Statements auf `node:sqlite`, kein ORM | Kein natives Modul, volle Kontrolle, gut testbar mit `:memory:` |
| A5 | Fachlogik (Überfälligkeit, aktuelle Phase, Wiederholungsberechnung, Risiko-Score) als **reine Funktionen in `shared/`** mit injizierbarem „heute“ | 100 % unit-testbar, Server und UI rechnen identisch |
| A6 | Frontend-Routing mit `react-router`; Filterzustand in der URL (`useSearchParams`) | Lesezeichen für Filter (Spec planning) |
| A7 | Keine UI-Komponentenbibliothek: eigenes schlankes CSS (CSS-Variablen) + wenige eigene Grundbausteine (Button, Tabelle, Dialog, Formularfeld) | Keine zusätzlichen Abhängigkeiten, volle Kontrolle über die Optik |
| A8 | Zeitleiste als eigene SVG-Komponente | Laut Spec |
| A9 | Datumsrechnung mit eigenen Hilfsfunktionen auf `YYYY-MM-DD`-Strings (UTC-basiert, keine Zeitzonen) | Keine Datumsbibliothek nötig |

### Benötigte Laufzeit-Abhängigkeiten (Freigabe nötig, siehe Spec „Vorher fragen“)

Zusätzlich zu Fastify, React, zod aus dem Tech-Stack:

- `@fastify/static`: gebautes Frontend ausliefern (A2)
- `react-router`: Navigation und Filter in der URL (A6)

Entwicklungs-Abhängigkeiten (keine Freigabe nötig): TypeScript, Vite, `@vitejs/plugin-react`, `tsx`, `concurrently`, ESLint, Prettier, Vitest, `@vitest/coverage-v8`, Playwright.

## Aufgaben

Größen: S = 1–2 Dateien · M = 3–5 Dateien · (Konfigurationsdateien beim Grundgerüst ausgenommen)

---

### Modul core

#### T1: Repo-Grundgerüst mit lauffähigem Hello-World
**Beschreibung:** package.json mit allen Skripten aus der Spec, TS-Konfiguration (strict), ESLint/Prettier, Vitest, `.nvmrc` (24), `engines`, `.gitattributes` (LF), `.gitignore` (`node_modules`, `dist`, `*.db`, Playwright-Reports). Minimaler Fastify-Server auf `127.0.0.1:5179` mit `GET /api/health` (vorerst ohne DB) und ein React-Frontend „PL-Cockpit“, das den Health-Status anzeigt.
**Akzeptanz:**
- `npm install`, `npm run dev`, `npm start`, `npm run check` funktionieren auf macOS.
- Kein npm-Skript enthält Shell-spezifische Syntax.
- Ein API-Test (`inject`) für `/api/health` ist grün.
**Verifikation:** `npm run check`; `npm start` → Browser zeigt „PL-Cockpit“ und „API: ok“.
**Abhängigkeiten:** keine · **Größe:** M (+ Konfiguration)

#### T2: CI auf Linux und Windows
**Beschreibung:** GitHub-Actions-Workflow, der bei Push/PR `npm ci` und `npm run check` auf `ubuntu-latest` und `windows-latest` mit Node 24 ausführt.
**Akzeptanz:** Workflow-Datei vorhanden und valide; läuft grün, sobald das Repo auf GitHub liegt.
**Verifikation:** Lauf in GitHub Actions (nach dem ersten Push).
**Abhängigkeiten:** T1 · **Größe:** S

#### T3: Datenbank, Datenablage und Migrations-Runner
**Beschreibung:** Ermittlung des Datenpfads (`%APPDATA%\pl-cockpit` / `~/.pl-cockpit` / `PL_COCKPIT_DATA_DIR`), Ordner anlegen, `node:sqlite` öffnen, Fremdschlüssel aktivieren, nummerierte Migrationen aus `server/migrations/` in einer Transaktion anwenden (`schema_migrations`). `/api/health` liefert `dbPath` und `schemaVersion`.
**Akzeptanz:**
- Erster Start legt die DB an, zweiter Start wendet nur neue Migrationen an.
- Fehlerhafte Migration → Rollback, Server startet nicht, verständliche Fehlermeldung.
- Pfadlogik für Windows und Unix ist unit-getestet (Umgebungsvariablen simuliert).
**Verifikation:** `npm test`; manuell: Start mit `PL_COCKPIT_DATA_DIR` auf einen Testordner.
**Abhängigkeiten:** T1 · **Größe:** M

#### T4: App-Gerüst mit Navigation
**Beschreibung:** Layout mit linker Seitenleiste (Start, Projektplanung, Aufgaben, Risiken, Weiterentwicklung, Stammdaten), Routing, Platzhalterseiten „Noch nicht umgesetzt“, Basis-CSS, UI-Grundbausteine (Button, Formularfeld, Tabelle), API-Client mit einheitlicher Fehlerbehandlung, Datumsformat `TT.MM.JJJJ`.
**Akzeptanz:** Alle Einträge erreichbar; aktiver Eintrag hervorgehoben; Direktaufruf einer Unterseite per URL funktioniert auch über `npm start` (SPA-Fallback).
**Verifikation:** `npm run check`; manuell alle Einträge durchklicken.
**Abhängigkeiten:** T1 · **Größe:** M

#### T5: Projekte anlegen und auflisten
**Beschreibung:** Migration `001_core.sql` (projects, teams), zod-Schemas in `shared/`, Repository, `GET/POST /api/projects`, Stammdaten-Seite mit Projektliste und Formular „Neues Projekt“ (Name, Kürzel, Farbe aus Palette, Beschreibung).
**Akzeptanz:** Anlegen funktioniert; doppelter Name (ohne Groß-/Kleinschreibung) → 409 und deutsche Meldung im Formular; Validierungsfehler je Feld angezeigt.
**Verifikation:** `npm test` (Repository + API); manuell Projekt anlegen.
**Abhängigkeiten:** T3, T4 · **Größe:** M

#### T6: Projekte bearbeiten und archivieren
**Beschreibung:** `PATCH /api/projects/:id`, Filter `archived=false|true|all`, Bearbeiten-Dialog, Archivieren/Wiederherstellen, Filter „Aktiv / Archiviert“ in der Liste.
**Akzeptanz:** Archivierte Projekte nur unter „Archiviert“ sichtbar; Wiederherstellen funktioniert; unbekannte ID → 404.
**Verifikation:** `npm test`; manuell archivieren/wiederherstellen.
**Abhängigkeiten:** T5 · **Größe:** S–M

#### T7: Teams verwalten
**Beschreibung:** Analog zu Projekten: `GET/POST/PATCH /api/teams`, Abschnitt „Teams“ in Stammdaten (anlegen, umbenennen, archivieren, wiederherstellen).
**Akzeptanz:** Wie Spec core, Erfolgskriterien 5 und 6.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** T5 · **Größe:** M

#### T8: E2E-Grundlage und Windows-Anleitung
**Beschreibung:** Playwright einrichten (Server mit temporärem `PL_COCKPIT_DATA_DIR`), E2E-Abläufe aus SPEC-core, `npm run test:e2e`. `docs/setup-windows.md` schreiben.
**Akzeptanz:** Die drei E2E-Abläufe aus SPEC-core sind grün; die Anleitung hat ≤ 10 Schritte inkl. Backup und Update.
**Verifikation:** `npm run test:e2e`.
**Abhängigkeiten:** T6, T7 · **Größe:** M

#### C1: Checkpoint core
- `npm run check` und `npm run test:e2e` grün; CI grün (falls Repo auf GitHub).
- **Windows-Probelauf** (empfohlen, kostet keine Kiro-Credits): auf dem Firmenrechner klonen → `npm install` → `npm start`.
- Rückmeldung von dir, bevor es weitergeht.

---

### Modul devstatus

#### T9: Parser für Spec- und Aufgabendateien
**Beschreibung:** Reine Funktionen in `server/src/modules/devstatus/`: Modulkarte aus `SPEC.md`, `Status:`-Zeile aus `SPEC-<id>.md`, Aufgaben aus `tasks/todo.md` (`[ ]`/`[~]`/`[x]`), Backlog aus „Nicht im Umfang (zurückgestellt)“, abgeleiteter Modulstatus.
**Akzeptanz:** Unit-Tests für: CRLF/LF, leere/fehlende Datei, unbekannte Modul-ID → „Sonstiges“, eingerückte Details ignoriert, alle Modulstatus-Übergänge.
**Verifikation:** `npm test`.
**Abhängigkeiten:** T1 · **Größe:** S–M

#### T10: Seite „Weiterentwicklung“
**Beschreibung:** `GET /api/devstatus` (Repo-Pfad über `PL_COCKPIT_REPO_DIR`, Standard App-Verzeichnis), Seite mit Gesamtfortschritt, „Aktuell in Arbeit“, Modulkarten mit aufklappbaren Aufgaben, Backlog, „Aktualisieren“. E2E gegen Fixture-Verzeichnis.
**Akzeptanz:** SPEC-devstatus, Erfolgskriterien 1–5; E2E grün.
**Verifikation:** `npm test`, `npm run test:e2e`; manuell: Status in `tasks/todo.md` ändern → „Aktualisieren“.
**Abhängigkeiten:** T4, T9 · **Größe:** M

#### C2: Checkpoint devstatus
- Ab hier siehst du den Baufortschritt im Tool selbst.

---

### Modul planning

#### T11: Anforderungen anlegen und auflisten
**Beschreibung:** Migration (requirements, requirement_teams), Schemas, Repository, `GET/POST/PATCH /api/requirements`, `PUT …/teams`; einfache Liste unter „Projektplanung“ und Detailseite mit Stammdaten (Titel, Projekt, Kunden-Ref., DevOps-ID, Beschreibung, Zustand, Teams).
**Akzeptanz:** Anlegen/Bearbeiten/Teamzuordnung funktioniert; archivierte Projekte nicht wählbar.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** C1 · **Größe:** M

#### T12: Phasentermine pflegen
**Beschreibung:** Migration `phase_schedules`, `PUT /api/requirements/:id/phases/:phase` (Modus gemeinsam/je Team), `PATCH /api/phase-schedules/:id` (erledigt), Phasentabelle in der Detailseite (Umschalter, Start, Ende, erledigt; Golive nur Datum).
**Akzeptanz:** Regeln aus SPEC-planning (Start/Ende Pflicht außer Golive, Ende ≥ Start, entweder gemeinsam oder je Team, nur zugeordnete Teams); Team mit Terminen entfernen → 409.
**Verifikation:** `npm test` (inkl. aller Validierungsregeln); manuell Erfolgskriterium 1.
**Abhängigkeiten:** T11 · **Größe:** M

#### T13: Ableitungslogik Planung
**Beschreibung:** Reine Funktionen in `shared/`: überfällig, läuft, aktuelle Phase, nächster Termin, aktueller Stand, jeweils mit optionalem Teamfilter.
**Akzeptanz:** 100 % Zeilen- und Zweigabdeckung für diese Datei.
**Verifikation:** `npm test -- --coverage`.
**Abhängigkeiten:** T12 · **Größe:** S

#### T14: Statusverlauf
**Beschreibung:** Migration `status_entries`, API (anlegen, bearbeiten, löschen), Abschnitt „Statusverlauf“ in der Detailseite (Eingabe oben mit Datum heute und optionalem Team, Einträge neueste zuerst).
**Akzeptanz:** Sortierung laut Spec; Bearbeiten/Löschen funktioniert.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** T11 · **Größe:** M

#### T15: Übersicht mit Filterleiste
**Beschreibung:** Liste wie in SPEC-planning „Übersicht“ (Projekt-Kürzel/Farbe, Teams, aktuelle Phase, nächster Termin, Überfällig-Markierung, aktueller Stand), Filterleiste (Projekt, Team, Zustand, nur überfällige, fällig in n Wochen) mit Zustand in der URL, Sortierung.
**Akzeptanz:** Erfolgskriterien 2, 3, 6; Filter überlebt Neuladen.
**Verifikation:** `npm test` (Filterlogik im API-Test); manuell.
**Abhängigkeiten:** T13, T14 · **Größe:** M

#### C3: Checkpoint Planung – Datenpflege
- Du kannst echte Anforderungen erfassen und die Übersicht nutzen. Kurzes Feedback zur Bedienung, bevor die Visualisierung kommt.

#### T16: Zeitleiste – Grundgerüst
**Beschreibung:** SVG-Komponente: Zeitachse mit Zoom (Wochen/Monate/Quartal), Standardausschnitt, Heute-Linie, Zeilen gruppiert nach Projekt, ein Balken je gemeinsamer Phase in Phasenfarben, Legende.
**Akzeptanz:** Balken positionieren sich korrekt (Skalenfunktion unit-getestet); Zoom wechselt die Achse.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** T15 · **Größe:** M

#### T17: Zeitleiste – Teams, Golive, Status, Interaktion
**Beschreibung:** Team-Unterzeilen bei Terminen je Team, Golive als Raute, erledigt blass, überfällig rote Kontur, Tooltip, Klick → Detailseite, gemeinsame Filterleiste.
**Akzeptanz:** Erfolgskriterium 4 vollständig.
**Verifikation:** manuell mit Testdaten; E2E in T20.
**Abhängigkeiten:** T16 · **Größe:** M

#### T18: Projektansicht
**Beschreibung:** Projektauswahl → Übersicht und Zeitleiste vorgefiltert, Kopfzeile (aktive Anforderungen, überfällige Termine, nächster Golive).
**Akzeptanz:** Kennzahlen stimmen mit den Daten überein (API-Test).
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** T17 · **Größe:** S–M

#### T19: Teamgespräch
**Beschreibung:** Teamauswahl → Liste der Anforderungen mit Team- und gemeinsamen Terminen (überfällige zuerst), aktueller Stand, Inline-Eingabe für Statuseintrag (Team vorbelegt, Strg+Enter), Phasen direkt abhaken.
**Akzeptanz:** Erfolgskriterium 5; neuer Eintrag erscheint ohne Neuladen.
**Verifikation:** manuell; E2E in T20.
**Abhängigkeiten:** T15 · **Größe:** M

#### T20: E2E und Performance Planung
**Beschreibung:** Die vier E2E-Abläufe aus SPEC-planning; Skript, das **synthetische** Testdaten erzeugt (50 Projekte / 500 Anforderungen) in eine temporäre DB, und ein Messtest für die Übersicht.
**Akzeptanz:** E2E grün; Übersicht-API < 1 s mit synthetischen Daten.
**Verifikation:** `npm run test:e2e`; Performance-Test.
**Abhängigkeiten:** T18, T19 · **Größe:** M

#### C4: Checkpoint planning
- Prio-1-Modul vollständig. Empfehlung: `code-reviewer` und `web-performance-auditor` laufen lassen.

---

### Modul tasks

#### T21: Wiederholungsberechnung
**Beschreibung:** Reine Funktion `nextOccurrence(rule, afterDate, today)` in `shared/` für alle Muster inkl. Monatsende, „letzter Wochentag“, Intervall, Nachholen bis ≥ heute; Klartext-Beschreibung einer Regel („alle 2 Wochen am Montag“).
**Akzeptanz:** SPEC-tasks, Erfolgskriterien 2–4 und 7 als Unit-Tests (Schaltjahr, Jahreswechsel).
**Verifikation:** `npm test -- --coverage`.
**Abhängigkeiten:** T1 · **Größe:** S

#### T22: Einmalige Aufgaben
**Beschreibung:** Migration `tasks`, API, Seite „Aufgaben“ (offen mit Filter Projekt/Zeitraum, Reiter „Erledigt“), anlegen, bearbeiten, abhaken, löschen.
**Akzeptanz:** Erfolgskriterium 1.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** C1 · **Größe:** M

#### T23: Wiederkehrende Aufgaben
**Beschreibung:** Migration `recurrences`, API, Reiter „Wiederkehrend“ (anlegen, bearbeiten, pausieren, beenden, Klartext, nächster Termin); Erledigen einer wiederkehrenden Aufgabe erzeugt die nächste (in einer Transaktion).
**Akzeptanz:** Erfolgskriterien 2, 3, 6 als API-Tests.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** T21, T22 · **Größe:** M

#### T24: Startseite
**Beschreibung:** `GET /api/home`, Startseite mit Überfällig / Heute / Diese Woche / Liefertermine der Teams / Später, Schnellerfassung, „morgen“ / „nächste Woche“, Link-Unterstützung für `link_type`.
**Akzeptanz:** Erfolgskriterium 5; Abschnittsgrenzen (Sonntag, Wochenwechsel) unit-getestet.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** T23, C4 · **Größe:** M

#### T25: E2E Aufgaben
**Beschreibung:** Die drei E2E-Abläufe aus SPEC-tasks.
**Verifikation:** `npm run test:e2e`.
**Abhängigkeiten:** T24 · **Größe:** S

#### C5: Checkpoint tasks
- Die Startseite ist deine tägliche Erinnerung. Ab hier ist das Tool im Alltag nutzbar.

---

### Modul risks

#### T26: Risikoregister
**Beschreibung:** Migration (risks, risk_notes), Score/Ampel in `shared/`, API, Registerseite je Projekt (Tabelle, Standardfilter, Sortierung), Detail/Bearbeiten mit Verlauf; automatische Notiz bei Bewertungs-/Zustandsänderung.
**Akzeptanz:** Erfolgskriterien 1 und 2.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** C1 · **Größe:** M

#### T27: Risikomatrix und übergreifende Ansicht
**Beschreibung:** 3 × 3-Matrix mit Klickfilter; Seite „Risiken“ mit allen offenen Risiken aller aktiven Projekte, Hinweise „Review fällig“ und überfällige Maßnahmen.
**Akzeptanz:** Erfolgskriterium 5.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** T26 · **Größe:** M

#### T28: Risikoreview aktivieren
**Beschreibung:** `GET/PUT /api/projects/:id/risk-review` legt bzw. ändert die Wiederholung mit `link_type = risk_review`; Kopfbereich im Register (Intervall, nächstes Review); Startseiten-Link „Zum Risikoregister“.
**Akzeptanz:** Erfolgskriterium 3.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** T26, C5 · **Größe:** M

#### T29: Geführtes Review
**Beschreibung:** „Review durchführen“: Durchgang Risiko für Risiko (nach Score), Bewertung/Maßnahme/Zustand anpassen, Notiz, „Geprüft“, „Review abschließen“ → erledigt die Aufgabe, nächste entsteht.
**Akzeptanz:** Erfolgskriterium 4.
**Verifikation:** `npm test`; manuell.
**Abhängigkeiten:** T28 · **Größe:** M

#### T30: E2E Risiken
**Beschreibung:** Die zwei E2E-Abläufe aus SPEC-risks.
**Verifikation:** `npm run test:e2e`.
**Abhängigkeiten:** T29 · **Größe:** S

#### C6: Checkpoint V1 komplett
- Alle Erfolgskriterien der Root-Spec erfüllt; Windows-Abnahme auf dem Firmenrechner; weiter mit `/test`, `/review`, `/ship`.

## Risiken und Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| `node:sqlite` verhält sich unter Windows/Node 24 anders oder gibt eine `ExperimentalWarning` aus | Hoch | Früh prüfen: T3 + CI auf Windows (T2) + Windows-Probelauf bei C1. Warnung ggf. gezielt unterdrücken. Fallback: `sql.js` (WebAssembly, ebenfalls ohne native Build-Tools) |
| Entwicklung hier mit Node 26, Ziel Node 24 | Mittel | CI testet mit Node 24; keine APIs nutzen, die erst nach Node 24 kamen |
| Firmen-Proxy/Virenscanner blockieren `npm install` oder Playwright-Browser auf dem Firmenrechner | Mittel | Playwright nur als Entwicklungs-Abhängigkeit; für den reinen Betrieb ist kein Browser-Download nötig (`npm ci --omit=dev` + vorgebautes `dist/` als ZIP-Fallback, wird in T8 dokumentiert) |
| Zeitleiste wird aufwändiger als gedacht | Mittel | Bewusst in zwei Aufgaben geteilt (T16/T17), keine Interaktion außer Klick/Tooltip |
| Wiederholungsregeln mit Randfällen (Monatsende, Schaltjahr) | Mittel | Reine Funktion zuerst und vollständig getestet (T21) |
| Kein GitHub-Repo → keine CI auf Windows | Mittel | Dann ist der manuelle Windows-Probelauf bei jedem Checkpoint Pflicht |

## Parallelisierung

Nicht vorgesehen: Ein Entwickler (ich) arbeitet sequenziell. T9 und T21 sind unabhängig und könnten vorgezogen werden.

## Offene Fragen

- Keine. Entscheidungen vom 2026-11-14: `@fastify/static` und `react-router` freigegeben. Repo kommt auf GitHub (Account neu, Repo wird bei T2 angelegt) → Windows-CI wie geplant.
