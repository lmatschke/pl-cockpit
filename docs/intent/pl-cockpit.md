# Intent: Persönliches PL-Cockpit

_Bestätigt am 2026-11-14 (Phase 0 – Verstehen)_

## Ergebnis
Ein persönliches PL-Cockpit als lokale Web-App mit zwei Teilen:

1. **Aufgaben-Tracker**
   - Wiederkehrende PL-Pflichten (z. B. Risikoreview) und einmalige Aufgaben.
   - Startseite „Heute / Diese Woche / Überfällig“ als Erinnerung.

2. **Arbeitsmodule**
   - **Prio 1 – Projektplanung**
     - Projekte mit ihren Kundenanforderungen.
     - Jede Anforderung durchläuft die Phasen *Konzeption → Entwicklung → MTS (interner Test) → ABN (Abnahmetest beim Kunden) → Golive (Meilenstein)*, terminiert **pro Anforderung**.
     - An einer Anforderung können **mehrere Teams** arbeiten, mit eigenen Terminen je Team. Typisch bei Konzeption und Entwicklung; MTS/ABN/Golive meist gemeinsam für die Anforderung. Das Tool erlaubt Termine je Team in jeder Phase.
     - **Statusverlauf je Anforderung**: datierte Einträge (Historie). Der neueste Eintrag ist als „aktueller Stand“ direkt in der Planungsansicht sichtbar und kann im Statusgespräch schnell ergänzt werden.
     - Sichten: **projektübergreifend** („Was müssen meine Teams wann liefern?“) und **pro Projekt**, jeweils als Liste und als visuelle Zeitleiste (Gantt-ähnlich, ohne Abhängigkeiten).
     - **Filter nach Team** zur Vorbereitung und Durchführung von Statusgesprächen.
   - **Prio 2 – Risikomanagement**
     - Schlankes Risikoregister je Projekt.
     - Regelmäßige Überprüfung über eine wiederkehrende Pflicht im Aufgaben-Tracker.

3. **Modul „Weiterentwicklung“**
   - Zeigt den Entwicklungsstand des PL-Cockpits selbst: Features → Aufgaben → Status (offen / in Arbeit / erledigt), Fortschritt je Feature.
   - Liest **automatisch** aus den Projektdateien im Repository (Aufgabenliste aus `/plan`, die nach jeder umgesetzten Aufgabe aktualisiert wird). Keine manuelle Pflege in der App.
   - Optional: Backlog für spätere Ideen (z. B. DevOps-Anbindung), ebenfalls als Datei im Repository.

## Nutzer
Nur der IT-Projektleiter selbst (Einzelnutzer), mit vielen parallelen Projekten.

## Warum jetzt
- Für Projektpläne, Risikomanagement und Status je Anforderung gibt es kein geeignetes Tool.
- Wiederkehrende PL-Routinen (v. a. Risikomanagement) laufen unter dem Radar.
- Ab 2027 kommen Kundenanforderungen über Azure DevOps (bisher separates Tool).

## Erfolg
- Morgens öffnen und ohne weitere Quelle sehen: was heute zu tun ist und welche Lieferungen welcher Teams bald fällig oder überfällig sind, über alle Projekte hinweg.
- Im Statusgespräch mit einem Team dessen gefilterte Sicht öffnen und den Stand direkt dort dokumentieren.

## Rahmenbedingungen
- Läuft lokal auf dem Firmenlaptop, keine Cloud; Kundendaten bleiben lokal.
- Pflege zunächst manuell.
- Datenmodell vorbereitet für späteren Azure-DevOps-Import (z. B. DevOps-ID je Anforderung).

## Nicht im Umfang (V1)
- Kein Ersatz für Azure-DevOps-Boards, SharePoint (Doku/Ablage) oder das bestehende Reporting-Tool.
- Keine Abhängigkeiten, kein kritischer Pfad, keine Kapazitäts-/Auslastungsplanung.
- Keine Mehrbenutzerfähigkeit.
- Keine Azure-DevOps-Anbindung und keine E-Mail-/Outlook-Erinnerungen in V1 (spätere Ausbaustufe).
