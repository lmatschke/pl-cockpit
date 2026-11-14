# PM-Tool

## Projektinfo
<!-- Nach /spec ausfüllen: Ziel, Tech-Stack, Befehle (install, dev, test, build, lint) -->
- Ziel: Persönliches PL-Cockpit (lokale Web-App, Einzelnutzer): Aufgaben-Tracker, Projektplanung, Risiken, Weiterentwicklung. Siehe SPEC.md + SPEC-<modul>.md
- Tech-Stack: Node 24 LTS, TypeScript, Fastify, SQLite (`node:sqlite`), React + Vite, zod, Vitest, Playwright. Muss ohne Änderungen unter Windows laufen.
- Testbefehl: `npm run check` (typecheck + lint + test), E2E: `npm run test:e2e`
- Specs auf Deutsch, Code/Kommentare/Commits auf Englisch.

## Sprache
Kommuniziere mit mir auf Deutsch. Code, Commits und Kommentare im Code auf Englisch.

## Entwicklungsprozess
Dieses Projekt folgt dem Lifecycle aus agent-skills (`.claude/skills`, `.claude/commands`).
Die Phasen laufen in dieser Reihenfolge. Jede Phase endet mit einem **Gate**: Fasse das Ergebnis
kurz zusammen, nenne den nächsten Schritt mit dem passenden Befehl und warte auf meine Freigabe.
Überspringe keine Phase stillschweigend. Wenn ich eine Phase überspringen will, weise einmal kurz
auf das Risiko hin.

| # | Phase | Befehl | Ergebnis | Gate / Hinweis an mich |
|---|-------|--------|----------|------------------------|
| 0 | Verstehen | Skill `interview-me` | `docs/intent/<thema>.md` | Eine Frage nach der anderen, bis die eigentliche Absicht klar ist. Zusammenfassung zur Bestätigung vorlegen, dann speichern. |
| 1 | Spezifizieren | `/spec` | `SPEC.md` | Auf Basis von `docs/intent/` aufbauen. Spec zur Freigabe vorlegen. Danach Projektinfo oben in dieser Datei ausfüllen. Optional `/constraints` für Qualitätsregeln vorschlagen. |
| 2 | Planen | `/plan` | Aufgabenliste mit Akzeptanzkriterien | Plan zur Freigabe vorlegen. |
| 3 | Bauen | `/build` | Code + Tests, Aufgabe für Aufgabe | Nach **jeder** Aufgabe den Test-Hinweis (siehe unten) geben. |
| 4 | Testen | `/test` | Grüne Tests, Bugs per Prove-It belegt | Ergebnis melden. Bei Lücken den Agenten `test-engineer` vorschlagen. |
| 5 | Reviewen | `/review` (oder Skill `code-review-and-quality`) | Review-Befunde | Befunde nach Schwere sortieren. Optional `/code-simplify` vorschlagen. |
| 6 | Ausliefern | `/ship` | Go/No-Go-Entscheidung | Checkliste und Entscheidung vorlegen, nichts ohne meine Freigabe deployen. |

Bei neuen größeren Features: ab Phase 0. Bei kleinen Änderungen an einem bestehenden Feature:
Delta-Spec über `/spec`, dann wieder ab Phase 2. Im Zweifel frag mich, ob ein Interview nötig ist.

## Test-Hinweis nach jeder Implementierung
Gib am Ende jeder abgeschlossenen Aufgabe einen kurzen Block **„Testen"** aus:
1. **Automatisch:** Welche Tests gelaufen sind und mit welchem Ergebnis (Befehl + Anzahl bestanden/fehlgeschlagen).
2. **Manuell:** 2–4 konkrete Schritte, die ich selbst ausprobieren sollte, z. B. „Projekt anlegen → Aufgabe zuweisen → Status ändern".
3. **Zusätzliche Checks:** Schlag passende Agenten vor, wenn sinnvoll, und frag, ob ich sie ausführen will:
   - `test-engineer`: Testabdeckung und -qualität
   - `security-auditor`: bei Login, Rechten, Benutzereingaben, Datenzugriff
   - `/webperf` (`web-performance-auditor`): bei größeren UI-Änderungen
   - `code-reviewer`: vor dem Abschluss eines Features

## Umgang mit wiederkehrenden Fehlern
Wenn ich dich korrigiere und derselbe Fehler (oder ein sehr ähnlicher) schon einmal in diesem
Projekt aufgetreten ist, eskaliere so:
1. **Erstes Auftreten:** Korrigieren, keine Regel.
2. **Wiederholung:** Schlag mir eine kurze, konkrete Regel für „Bekannte Fallstricke" vor
   (Was ist falsch, was ist richtig, warum). Trag sie **erst nach meiner Freigabe** ein.
3. **Fehler trotz Regel:** Schlag vor, die Regel technisch zu erzwingen (Test, Linter, Hook, ggf. über
   `/constraints`). Nach der Umsetzung den Eintrag unten als „erzwungen durch …" markieren.

Halte den Abschnitt schlank: höchstens ca. 15 Einträge. Wenn er wächst, schlag vor, Einträge
zusammenzufassen oder zu streichen, die nicht mehr relevant oder bereits erzwungen sind.

## Bekannte Fallstricke
<!-- Format: - **Falsch:** … → **Richtig:** … (Grund: …) [ggf. erzwungen durch: …] -->
_Noch keine Einträge._

## Statusanzeige
Wenn ich frage „Wo stehen wir?", nenne die aktuelle Phase, erledigte und offene Aufgaben aus dem Plan
und den nächsten Befehl.
