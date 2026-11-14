# Spec: devstatus — V1

Status: Freigegeben (2026-11-14)
Root-Spec: [SPEC.md](SPEC.md) (erbt Stack, Befehle, Struktur, Stil, Tests, Grenzen)

## Ziel

Das Modul **„Weiterentwicklung“** zeigt den Entwicklungsstand des PL-Cockpits selbst, damit der
Fortschritt nicht mühsam in der Entwicklungsumgebung nachvollzogen werden muss. Es liest
**automatisch** die Dateien im Repository, die im Entwicklungsprozess ohnehin gepflegt werden.
In der App wird nichts manuell gepflegt (nur lesend).

## Datenquellen

Das Modul liest beim Aufruf (live, kein Cache nötig) aus dem App-Verzeichnis:

| Quelle | Was wird gelesen |
|---|---|
| `SPEC.md` → Abschnitt „Modulkarte“ | Liste der Module (Modul-ID, Verantwortung) in Reihenfolge |
| `SPEC-<modul-id>.md` → Zeile `Status: …` | Spec-Status je Modul (z. B. „Entwurf“, „Freigegeben (Datum)“); fehlt die Datei: „Spec ausstehend“ |
| `tasks/todo.md` | Aufgaben je Modul mit Status |
| `SPEC.md` → Abschnitt „Nicht im Umfang (zurückgestellt)“ | Backlog für spätere Versionen |

Fehlt eine Datei (z. B. `tasks/todo.md` vor Phase 2), zeigt das Modul einen Hinweis statt eines Fehlers.

### Format von `tasks/todo.md` (verbindlich)

Dieses Format wird von `/plan` erzeugt und nach jeder Aufgabe aktualisiert:

```markdown
# Aufgaben

## core – Grundlage
- [x] T1: Repo-Grundgerüst und CI
- [~] T2: Datenbank und Migrations-Runner
- [ ] T3: Stammdaten Projekte

## planning – Projektplanung
- [ ] T10: Anforderungen anlegen
```

- Abschnitt je Modul: `## <modul-id> – <Titel>`
- Aufgabe: `- [ ]` offen, `- [~]` in Arbeit, `- [x]` erledigt, gefolgt von `<ID>: <Titel>`.
- Eingerückte Zeilen unter einer Aufgabe (Details, Akzeptanzkriterien) werden ignoriert.
- Unbekannte Zeilen werden ignoriert. Nicht zuordenbare Aufgaben (z. B. Abschnitt mit unbekannter Modul-ID) erscheinen unter „Sonstiges“.

## Ansicht

Eine Seite „Weiterentwicklung“:

1. **Gesamtfortschritt:** erledigte / alle Aufgaben als Balken und Prozentzahl.
2. **Module** in der Reihenfolge der Modulkarte, je Modul eine Karte mit:
   - Name und Verantwortung
   - Spec-Status
   - Fortschrittsbalken (erledigt / gesamt) und Zähler offen / in Arbeit / erledigt
   - Modulstatus (abgeleitet): *Spec ausstehend* → *Spezifiziert* → *Geplant* (Aufgaben vorhanden) → *In Umsetzung* (≥ 1 Aufgabe in Arbeit oder erledigt) → *Fertig* (alle erledigt)
   - Aufklappbare Aufgabenliste mit Status-Symbol
3. **Aktuell in Arbeit:** alle Aufgaben mit `[~]`, oben hervorgehoben.
4. **Backlog (zurückgestellt):** Liste aus der Root-Spec.
5. Zeitpunkt „Stand gelesen: TT.MM.JJJJ HH:MM“ und Button „Aktualisieren“.

## API

```
GET /api/devstatus   → { modules: [...], other: [...], backlog: [...], readAt, warnings: [...] }
```

## Erfolgskriterien

1. Nach einer Änderung an `tasks/todo.md` zeigt „Aktualisieren“ den neuen Stand ohne Neustart.
2. Fortschritt und Zähler stimmen mit der Datei überein (`[ ]`, `[~]`, `[x]`).
3. Module ohne Spec-Datei werden als „Spec ausstehend“ angezeigt; ohne `tasks/todo.md` erscheint ein Hinweis statt eines Fehlers.
4. Der Parser verarbeitet Windows- (CRLF) und Unix-Zeilenenden (LF) gleich.
5. Das Modul schreibt nie in die Dateien.
6. Der Parser ist mit Unit-Tests abgedeckt (inkl. leerer Datei, fehlender Datei, unbekannter Modul-ID, eingerückter Details).

## E2E-Abläufe

- Weiterentwicklung öffnen → Module der Modulkarte erscheinen in Reihenfolge → mindestens ein Modul zeigt Fortschritt aus einer Test-`todo.md`.
  (E2E läuft gegen ein Test-Verzeichnis mit Fixture-Dateien, nicht gegen die echte `tasks/todo.md`; Pfad über `PL_COCKPIT_REPO_DIR` konfigurierbar.)

## Nicht im Umfang (devstatus)

- Bearbeiten von Aufgaben in der App.
- Git-Historie, Commits, Testergebnisse oder CI-Status anzeigen.
- Lesen von `tasks/plan.md` (Details stehen dort, die Übersicht reicht aus `todo.md`).

## Offene Fragen

- Keine.
