# Spec: tasks — V1

Status: Freigegeben (2026-11-14)
Root-Spec: [SPEC.md](SPEC.md) (erbt Stack, Befehle, Struktur, Stil, Tests, Grenzen)
Baut auf: [SPEC-core.md](SPEC-core.md) (Projekte), [SPEC-planning.md](SPEC-planning.md) (Liefertermine auf der Startseite)

## Ziel

Der Aufgaben-Tracker für die eigenen PL-Pflichten: wiederkehrende Routinen (z. B. „Risikoreview
Projekt X“, „Lenkungskreis vorbereiten“) und einmalige Aufgaben (z. B. „Freigabe bei Y einholen“).
Die **Startseite** ist die tägliche Erinnerung: Wer morgens das Tool öffnet, sieht alles, was ansteht,
einschließlich der fälligen Liefertermine der Teams aus der Projektplanung.

## Datenmodell

### `tasks`

| Feld | Typ | Regeln |
|---|---|---|
| `id` | integer | Primärschlüssel |
| `title` | text | Pflicht, 1–200 Zeichen |
| `notes` | text | optional |
| `project_id` | integer \| null | optional, FK → projects |
| `due_date` | text | Pflicht, `YYYY-MM-DD` |
| `done` | boolean | Standard false |
| `done_at` | text \| null | ISO-Zeitstempel beim Erledigen |
| `recurrence_id` | integer \| null | FK → recurrences; gesetzt, wenn die Aufgabe aus einer Wiederholung stammt |
| `link_type` | text \| null | z. B. `risk_review` (wird vom Modul `risks` genutzt) |
| `created_at`, `updated_at` | text | ISO-Zeitstempel |

### `recurrences` (Wiederholungsregel einer wiederkehrenden Aufgabe)

| Feld | Typ | Regeln |
|---|---|---|
| `id` | integer | Primärschlüssel |
| `title`, `notes`, `project_id`, `link_type` | | Vorlage für jede erzeugte Aufgabe |
| `pattern` | text | `daily_workdays` · `weekly` · `monthly_day` · `monthly_weekday` |
| `interval` | integer | ≥ 1 (z. B. alle **2** Wochen, alle **3** Monate = quartalsweise) |
| `weekday` | integer \| null | 1 = Montag … 5 = Freitag (für `weekly`, `monthly_weekday`) |
| `day_of_month` | integer \| null | 1–31 (für `monthly_day`; bei kürzeren Monaten = letzter Tag) |
| `week_of_month` | integer \| null | 1–4 oder −1 = letzte (für `monthly_weekday`, z. B. „erster Montag“) |
| `start_date` | text | erster möglicher Termin |
| `active` | boolean | pausieren / beenden ohne Historie zu verlieren |

### Verhalten wiederkehrender Aufgaben

- Zu jeder aktiven Wiederholung existiert **genau eine offene Aufgabe** (die nächste Fälligkeit).
- Wird sie erledigt, entsteht sofort die nächste Aufgabe zum **nächsten Termin laut Regel nach dem bisherigen Fälligkeitsdatum** (fester Rhythmus, nicht ab Erledigungsdatum). Liegt dieser Termin noch in der Vergangenheit, wird bis zum ersten Termin ≥ heute weitergesprungen. Verpasste Termine stauen sich nicht.
- Verschieben einer einzelnen Fälligkeit ändert die Regel nicht.
- Erledigte Aufgaben bleiben als Historie erhalten.

## Startseite („Start“)

Ersetzt den Platzhalter aus core. Abschnitte von oben nach unten:

1. **Überfällig:** offene Aufgaben mit `due_date < heute`, älteste zuerst, rot markiert.
2. **Heute.**
3. **Diese Woche:** Rest der laufenden Kalenderwoche (bis Sonntag).
4. **Liefertermine der Teams** (aus planning): überfällige Phasentermine und Phasentermine mit Ende in den nächsten 7 Tagen, mit Projekt, Anforderung, Phase, Team; Klick öffnet die Anforderung.
5. **Später:** eingeklappt, Anzahl sichtbar.

Je Aufgabe: Checkbox „erledigt“, Titel, Projekt-Kürzel, Wiederholungssymbol, Schnellaktionen **„morgen“** und **„nächste Woche“** (Montag) zum Verschieben. Eine Aufgabe mit `link_type` zeigt zusätzlich einen Sprung-Link (z. B. „Zum Risikoregister“).

Oben auf der Startseite: **Schnellerfassung** (Titel, Fälligkeit Standard heute, optional Projekt), Speichern mit Enter.

## Seite „Aufgaben“

- Liste aller offenen Aufgaben mit Filter nach Projekt und Zeitraum; Reiter „Erledigt“ (Historie, neueste zuerst).
- Reiter **„Wiederkehrend“**: alle Wiederholungsregeln mit Klartext („alle 2 Wochen am Montag“, „am ersten Montag jedes Monats“), nächster Termin, aktiv/pausiert. Anlegen, bearbeiten, pausieren, beenden.
- Aufgabe bearbeiten (Titel, Notizen, Projekt, Fälligkeit) und löschen (einmalige Aufgaben; bei wiederkehrenden nur die Regel beenden).

## API

```
GET    /api/tasks?status=open|done&project=&from=&to=
POST   /api/tasks
PATCH  /api/tasks/:id                (inkl. done, due_date)
DELETE /api/tasks/:id                (nur ohne recurrence_id)
GET    /api/recurrences
POST   /api/recurrences              (legt die erste offene Aufgabe an)
PATCH  /api/recurrences/:id          (inkl. active)
GET    /api/home                     (alle Abschnitte der Startseite in einem Aufruf)
```

## Erfolgskriterien

1. Eine einmalige Aufgabe mit Fälligkeit gestern erscheint unter „Überfällig“; nach dem Abhaken verschwindet sie und steht unter „Erledigt“.
2. Wiederholung „alle 2 Wochen am Montag“: Erledigen der offenen Aufgabe erzeugt genau eine neue Aufgabe zwei Wochen nach dem bisherigen Fälligkeitsdatum.
3. Wird eine wöchentliche Aufgabe drei Wochen nicht erledigt, existiert trotzdem nur eine offene Aufgabe; nach dem Erledigen liegt die nächste auf dem nächsten Termin ≥ heute.
4. „Am ersten Montag jedes Monats“, „am letzten Freitag“, „am 31. jedes Monats“ (Februar → 28./29.) und „alle 3 Monate“ werden korrekt berechnet.
5. Die Startseite zeigt überfällige und in 7 Tagen fällige Liefertermine aus planning.
6. „Morgen“ / „nächste Woche“ verschieben nur die Aufgabe, nicht die Regel.
7. Die Terminberechnung ist vollständig unit-getestet (inkl. Monatsenden, Schaltjahr, Jahreswechsel).

## E2E-Abläufe

- Startseite → Schnellerfassung „Freigabe einholen“ für heute → erscheint unter „Heute“ → „morgen“ → erscheint unter „Diese Woche“ (bzw. „Später“ am Sonntag) → abhaken.
- Wiederkehrende Aufgabe „Statusmeeting vorbereiten“ wöchentlich am Montag anlegen → offene Aufgabe erscheint → abhaken → nächste Woche erscheint.
- Phasentermin in planning mit Ende in 3 Tagen anlegen → erscheint auf der Startseite unter „Liefertermine der Teams“.

## Nicht im Umfang (tasks)

- E-Mail-/Outlook-/Desktop-Benachrichtigungen (siehe Root-Spec).
- Prioritäten, Unteraufgaben, Tags.
- Uhrzeiten (nur Datum).
- Vorlagenpakete für PL-Routinen beim Anlegen eines Projekts.

## Offene Fragen

- Keine. Entscheidungen vom 2026-11-14: Wiederholungsmuster wie spezifiziert; nur eine offene Aufgabe je Wiederholung (verpasste Termine verfallen); keine Vorlagenpakete in V1.
