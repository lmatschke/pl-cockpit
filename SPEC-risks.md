# Spec: risks — V1

Status: Freigegeben (2026-11-14)
Root-Spec: [SPEC.md](SPEC.md) (erbt Stack, Befehle, Struktur, Stil, Tests, Grenzen)
Baut auf: [SPEC-core.md](SPEC-core.md) (Projekte), [SPEC-tasks.md](SPEC-tasks.md) (wiederkehrende Review-Aufgabe)

## Ziel

Ein schlankes Risikoregister je Projekt, das **regelmäßig geprüft wird**, statt nach dem Kick-off
unter dem Radar zu verschwinden. Das Tool erinnert über eine wiederkehrende Aufgabe an das Review
und macht das Review selbst schnell.

## Datenmodell

### `risks`

| Feld | Typ | Regeln |
|---|---|---|
| `id` | integer | Primärschlüssel |
| `project_id` | integer | Pflicht, FK → projects |
| `title` | text | Pflicht, 1–200 Zeichen |
| `description` | text | optional (Ursache / Auswirkung) |
| `probability` | integer | Pflicht, 1–3 (gering · mittel · hoch) |
| `impact` | integer | Pflicht, 1–3 (gering · mittel · hoch) |
| `mitigation` | text | optional, Maßnahme |
| `owner` | text | optional, Freitext (Person/Team) |
| `mitigation_due` | text \| null | optional, `YYYY-MM-DD` |
| `state` | text | `offen` (Standard) · `in_behandlung` · `geschlossen` · `eingetreten` |
| `last_reviewed_at` | text \| null | Datum des letzten Reviews |
| `created_at`, `updated_at` | text | ISO-Zeitstempel |

### `risk_notes`

Datierter Verlauf je Risiko (wie Statuseinträge in planning): `risk_id`, `entry_date`, `text`.
Änderungen an Wahrscheinlichkeit, Auswirkung oder Zustand erzeugen automatisch eine Notiz
(„Bewertung 3×2 → 2×2“).

### Abgeleitete Werte

- **Score** = Wahrscheinlichkeit × Auswirkung (1–9).
- **Ampel:** grün 1–2 · gelb 3–4 · rot 6–9.
- **Review fällig:** offenes Risiko, dessen `last_reviewed_at` älter als das Review-Intervall des Projekts ist (oder nie geprüft).
- **Maßnahme überfällig:** `mitigation_due < heute` und Zustand `offen` / `in_behandlung`.

## Review-Mechanik (Integration mit tasks)

- Je Projekt lässt sich ein **Risikoreview** aktivieren: Intervall (Standard alle 2 Wochen, Montag). Das legt eine wiederkehrende Aufgabe „Risikoreview <Projekt>“ mit `link_type = risk_review` an.
- Die Aufgabe auf der Startseite hat den Link **„Zum Risikoregister“**.
- Im Register startet **„Review durchführen“** einen Durchgang durch alle offenen Risiken des Projekts (sortiert nach Score): je Risiko Bewertung, Maßnahme und Zustand prüfen bzw. ändern, optional Notiz, dann **„Geprüft“** (setzt `last_reviewed_at`) und weiter zum nächsten.
- Nach dem letzten Risiko: **„Review abschließen“** erledigt die offene Review-Aufgabe; die nächste entsteht automatisch laut Regel.

## Ansichten

### Risikoregister (je Projekt)
- Tabelle: Ampel/Score · Titel · W × A · Maßnahme · Verantwortlich · Maßnahme fällig · Zustand · zuletzt geprüft.
- Standard: nur `offen` und `in_behandlung`, sortiert nach Score absteigend.
- **Risikomatrix** 3 × 3 (Wahrscheinlichkeit × Auswirkung) mit Anzahl je Feld; Klick auf ein Feld filtert die Tabelle.
- Kopf: Review-Intervall, nächstes Review, Button „Review durchführen“.

### Risiken übergreifend
- Alle offenen Risiken aller aktiven Projekte, sortiert nach Score, mit Projekt-Kürzel.
- Hinweise: „Review fällig“ je Projekt, überfällige Maßnahmen.

### Detail / Bearbeiten
- Alle Felder, Verlauf der Notizen, neue Notiz erfassen.

## API

```
GET    /api/risks?project=&state=
POST   /api/risks
GET    /api/risks/:id                (inkl. notes)
PATCH  /api/risks/:id
POST   /api/risks/:id/notes
POST   /api/risks/:id/review          (setzt last_reviewed_at, optional Notiz)
GET    /api/projects/:id/risk-review   (Intervall, nächster Termin)
PUT    /api/projects/:id/risk-review   (aktivieren/ändern/deaktivieren → Wiederholung in tasks)
POST   /api/projects/:id/risk-review/complete   (erledigt die offene Review-Aufgabe)
```

Kein Löschen von Risiken in V1 (Zustand `geschlossen` stattdessen).

## Erfolgskriterien

1. Risiko mit W = 3, A = 2 erscheint rot mit Score 6 in Register, Matrix und übergreifender Liste.
2. Ändern der Bewertung erzeugt automatisch eine Verlaufsnotiz.
3. Aktivieren des Risikoreviews legt eine wiederkehrende Aufgabe an, die auf der Startseite mit Link zum Register erscheint.
4. Ein vollständiger Review-Durchgang setzt bei allen geprüften Risiken das Prüfdatum und erledigt die Review-Aufgabe; die nächste ist gemäß Intervall angelegt.
5. Projekte mit fälligem Review und überfällige Maßnahmen werden in der übergreifenden Ansicht markiert.

## E2E-Abläufe

- Projekt öffnen → 3 Risiken mit unterschiedlicher Bewertung anlegen → Matrix zeigt Verteilung → Klick auf Feld filtert die Tabelle.
- Risikoreview aktivieren → Aufgabe erscheint auf der Startseite → Link öffnet Register → Review durchführen, ein Risiko neu bewerten → abschließen → Aufgabe erledigt, nächste angelegt.

## Nicht im Umfang (risks)

- Chancen (positive Risiken), Kategorien, Risikokosten / Erwartungswert.
- Projektübergreifende Risiken ohne Projektbezug.
- Löschen von Risiken.

## Offene Fragen

- Keine. Entscheidungen vom 2026-11-14: Skala 1–3 (Matrix 3 × 3); Ampel analog zur bestätigten 5er-Logik auf 3er-Skala übertragen (grün 1–2, gelb 3–4, rot 6–9); geführtes Review.
