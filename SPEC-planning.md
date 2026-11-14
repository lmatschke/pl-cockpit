# Spec: planning — V1

Status: Freigegeben (2026-11-14)
Root-Spec: [SPEC.md](SPEC.md) (erbt Stack, Befehle, Struktur, Stil, Tests, Grenzen)
Baut auf: [SPEC-core.md](SPEC-core.md) (Projekte, Teams)

## Ziel

Die Projektplanung ist das wichtigste Arbeitsmodul. Sie beantwortet:

- *Was müssen meine Teams wann liefern, über alle Projekte hinweg?*
- *Wie steht ein einzelnes Projekt?*
- *Was bespreche ich im Statusgespräch mit Team X, und wo halte ich den Stand fest?*

## Begriffe

- **Anforderung:** eine Kundenanforderung, gehört zu genau einem Projekt, an ihr arbeiten ein oder mehrere Teams.
- **Phasen** (feste Reihenfolge): **Konzeption → Entwicklung → MTS** (interner Test) **→ ABN** (Abnahmetest beim Kunden) **→ Golive** (Meilenstein, nur ein Datum).
- **Phasentermin:** Zeitraum (Start, Ende) einer Phase, entweder für die **ganze Anforderung** oder für **ein bestimmtes Team**.
- **Statuseintrag:** datierte Notiz zum aktuellen Stand einer Anforderung; der neueste Eintrag ist der „aktuelle Stand“.

## Datenmodell

### `requirements`

| Feld | Typ | Regeln |
|---|---|---|
| `id` | integer | Primärschlüssel |
| `project_id` | integer | Pflicht, FK → projects |
| `title` | text | Pflicht, 1–200 Zeichen |
| `customer_ref` | text | optional, ID/Nummer im Kundentool |
| `devops_id` | text | optional, für spätere DevOps-Anbindung (nur Anzeige/Link in V1) |
| `description` | text | optional |
| `state` | text | `aktiv` (Standard) · `pausiert` · `abgeschlossen` · `verworfen` |
| `created_at`, `updated_at` | text | ISO-Zeitstempel |

### `requirement_teams` (welche Teams arbeiten an der Anforderung)

| Feld | Typ | Regeln |
|---|---|---|
| `requirement_id` | integer | FK |
| `team_id` | integer | FK |
| | | Kombination eindeutig; mindestens 1 Team nicht erzwungen (Anforderung kann zunächst ohne Team angelegt werden) |

### `phase_schedules`

| Feld | Typ | Regeln |
|---|---|---|
| `id` | integer | Primärschlüssel |
| `requirement_id` | integer | FK |
| `phase` | text | `konzeption` · `entwicklung` · `mts` · `abn` · `golive` |
| `team_id` | integer \| null | `null` = gilt für die ganze Anforderung; sonst ein Team aus `requirement_teams` |
| `start_date` | text \| null | Pflicht für alle Phasen außer `golive`, `YYYY-MM-DD`; bei `golive` immer `null` |
| `end_date` | text | Pflicht, `YYYY-MM-DD`, ≥ `start_date`; bei `golive` = Golive-Datum |
| `done` | boolean | Standard false |
| `done_date` | text \| null | wird beim Abhaken auf heute gesetzt, änderbar |

Regeln:
- Je Anforderung, Phase und Team höchstens ein Eintrag (`requirement_id, phase, team_id` eindeutig; `null` zählt als „gemeinsam“).
- Eine Phase hat **entweder** einen gemeinsamen Termin **oder** Termine je Team, nicht beides.
- Phasen ohne Eintrag sind „nicht geplant“ (erlaubt).
- Keine Prüfung der Phasenreihenfolge über Termine (Überschneidungen sind erlaubt, z. B. Entwicklung Team A läuft noch, während MTS für Team B beginnt).

### `status_entries`

| Feld | Typ | Regeln |
|---|---|---|
| `id` | integer | Primärschlüssel |
| `requirement_id` | integer | FK |
| `entry_date` | text | Pflicht, Standard heute |
| `team_id` | integer \| null | optional: Eintrag betrifft ein bestimmtes Team |
| `text` | text | Pflicht, 1–4000 Zeichen |
| `created_at`, `updated_at` | text | ISO-Zeitstempel |

- Einträge können bearbeitet und gelöscht werden (es sind persönliche Notizen).
- Sortierung: `entry_date` absteigend, dann `created_at` absteigend.

## Abgeleitete Werte (in `shared/`, unit-getestet)

- **Überfällig:** Phasentermin mit `done = false` und `end_date < heute`.
- **Läuft:** `done = false` und `start_date ≤ heute ≤ end_date`.
- **Aktuelle Phase** einer Anforderung: früheste Phase in fester Reihenfolge mit mindestens einem nicht erledigten Termin. Sind alle geplanten Termine erledigt: „Alle Phasen erledigt“.
- **Nächster Termin:** frühestes `end_date` aller nicht erledigten Termine (bei Teamfilter nur Termine dieses Teams plus gemeinsame Termine).
- **Aktueller Stand:** neuester Statuseintrag (bei Teamfilter: neuester Eintrag dieses Teams oder ohne Team).

## Ansichten

Alle Ansichten haben eine gemeinsame **Filterleiste**: Projekt (Mehrfachauswahl), Team (Mehrfachauswahl), Zustand (Standard: nur `aktiv`), Schalter „nur überfällige“, Zeitraum „fällig in den nächsten … Wochen“. Filter bleiben in der URL erhalten (Link/Lesezeichen möglich).

### 1. Übersicht (Liste, projektübergreifend), Standardansicht
Eine Zeile je Anforderung:
Projekt (Kürzel + Farbe) · Anforderung · Teams · Aktuelle Phase · Nächster Termin · Überfällig-Markierung (rot) · Aktueller Stand (erste Zeile, gekürzt, mit Datum).
Sortierbar nach Projekt, nächstem Termin, aktueller Phase. Klick öffnet die Detailansicht.

### 2. Zeitleiste (visuell)
- Zeilen gruppiert nach Projekt, darunter je Anforderung eine Zeile; hat eine Phase Termine je Team, bekommt jedes Team eine eigene Unterzeile.
- Balken je Phase in festen Phasenfarben (Legende), Golive als Raute.
- Erledigte Phasen blass, überfällige mit roter Kontur.
- Senkrechte Linie für „heute“.
- Zoom: Wochen · Monate · Quartal. Standardausschnitt: 2 Wochen zurück bis 3 Monate voraus.
- Tooltip mit Phase, Team, Zeitraum und Status. Klick öffnet die Detailansicht.
- Gleiche Filterleiste wie die Übersicht.

### 3. Projektansicht
Die Übersicht und die Zeitleiste vorgefiltert auf ein Projekt, erreichbar über die Projektauswahl. Kopfzeile mit Projektname, Anzahl aktiver Anforderungen, Anzahl überfälliger Termine und dem nächsten Golive.

### 4. Teamgespräch
Vorgefiltert auf ein Team, gedacht für das Statusgespräch:
- Liste der Anforderungen des Teams mit den Terminen dieses Teams und den gemeinsamen Terminen, überfällige zuerst.
- Je Anforderung: aktueller Stand und ein **Eingabefeld für einen neuen Statuseintrag direkt in der Liste** (Datum heute, Team vorbelegt, Speichern per Button oder Strg+Enter), ohne die Seite zu verlassen.
- Phasen können direkt abgehakt werden.

### 5. Detailansicht Anforderung
- Stammdaten bearbeiten (Titel, Projekt, Kunden-Ref., DevOps-ID, Beschreibung, Zustand, Teams).
- **Phasentabelle:** je Phase Umschalter „gemeinsam / je Team“, Start, Ende, erledigt. Golive nur Datum.
- **Statusverlauf:** Eingabe oben, darunter alle Einträge chronologisch (neueste zuerst), mit optionalem Team.
- Mini-Zeitleiste der Anforderung.

## API

```
GET    /api/requirements?project=&team=&state=&overdue=&dueWithinWeeks=
POST   /api/requirements
GET    /api/requirements/:id                 (inkl. teams, phases, status entries)
PATCH  /api/requirements/:id
PUT    /api/requirements/:id/teams           ({ teamIds: [...] })
PUT    /api/requirements/:id/phases/:phase   ({ mode: "shared"|"per-team", entries: [...] })
PATCH  /api/phase-schedules/:id               (z. B. done)
POST   /api/requirements/:id/status-entries
PATCH  /api/status-entries/:id
DELETE /api/status-entries/:id
```

Fehlercodes wie in [SPEC-core.md](SPEC-core.md#api). Entfernt man ein Team von einer Anforderung, das noch Phasentermine hat, antwortet die API mit `409` und einer verständlichen Meldung.

## Erfolgskriterien

1. Eine Anforderung mit zwei Teams lässt sich anlegen; Konzeption und Entwicklung bekommen Termine je Team, MTS/ABN gemeinsame Termine, Golive ein Datum.
2. Die Übersicht zeigt Anforderungen aller aktiven Projekte; Filter nach Projekt und Team liefern korrekte Ergebnisse (Teamfilter berücksichtigt Teamtermine und gemeinsame Termine).
3. Ein nicht erledigter Termin mit Ende in der Vergangenheit wird in Liste, Zeitleiste und Teamgespräch als überfällig markiert.
4. Die Zeitleiste zeigt Phasenbalken, Team-Unterzeilen, Golive-Raute und Heute-Linie; Zoom funktioniert.
5. Im Teamgespräch lässt sich ein Statuseintrag mit höchstens einem Klick in das Eingabefeld, Text und Strg+Enter erfassen; er erscheint sofort als aktueller Stand.
6. Archivierte Projekte und deren Anforderungen erscheinen nicht in den Standardansichten.
7. Ableitungslogik (überfällig, aktuelle Phase, nächster Termin, aktueller Stand) ist zu 100 % durch Unit-Tests abgedeckt.
8. Die Übersicht lädt mit 50 Projekten / 500 Anforderungen in unter 1 Sekunde.

## E2E-Abläufe

- Projekt + 2 Teams anlegen → Anforderung anlegen → Teams zuordnen → Entwicklung je Team terminieren, MTS gemeinsam, Golive setzen → erscheint in Übersicht und Zeitleiste.
- Termin in der Vergangenheit setzen → Überfällig-Markierung erscheint → Phase abhaken → Markierung verschwindet.
- Teamgespräch für Team A öffnen → Statuseintrag per Strg+Enter erfassen → erscheint als aktueller Stand in Teamgespräch und Übersicht.
- Übersicht nach Projekt filtern → URL enthält Filter → Seite neu laden → Filter bleibt.

## Nicht im Umfang (planning)

- Abhängigkeiten, kritischer Pfad, Kapazität (siehe Root-Spec).
- Drag & Drop von Balken in der Zeitleiste (Termine werden in der Detailansicht gepflegt).
- Eigene Projekt-Meilensteine außerhalb der Anforderungen (z. B. Lenkungskreis).
- Import aus dem Kundentool oder DevOps; Export (CSV/Excel).
- Löschen von Anforderungen (Zustand `verworfen` stattdessen).

## Offene Fragen

- Keine. Entscheidungen vom 2026-11-14: Zustände wie spezifiziert; Start und Ende je Phase Pflicht (außer Golive); keine Projekt-Meilensteine; kein Drag & Drop in V1.
