# PL-Cockpit unter Windows einrichten

Diese Anleitung richtet PL-Cockpit auf dem Windows-Firmenlaptop ein. Es werden keine
Administratorrechte für die App selbst benötigt, nur für die Installation von Node.js (je nach
Firmenrichtlinie).

## Einrichtung (einmalig)

1. **Node.js 24 LTS installieren:** von <https://nodejs.org> den Installer „LTS“ (Version 24.x)
   herunterladen und mit den Standardeinstellungen installieren.
   Alternativ in PowerShell: `winget install OpenJS.NodeJS.LTS`
2. **Prüfen:** neues PowerShell-Fenster öffnen und `node -v` eingeben → Ausgabe beginnt mit `v24`.
3. **Code holen**, eine der beiden Varianten:
   - **Mit Git** (empfohlen, für einfache Updates):
     `git clone https://github.com/lmatschke/pl-cockpit.git` und dann `cd pl-cockpit`
   - **Als ZIP:** auf GitHub „Code → Download ZIP“, entpacken (z. B. nach
     `C:\Users\<du>\pl-cockpit`) und in PowerShell in diesen Ordner wechseln (`cd …`).
4. **Abhängigkeiten installieren:** `npm install` (dauert beim ersten Mal 1–2 Minuten).

## Starten

5. `npm start` ausführen. Sobald `PL-Cockpit läuft auf http://127.0.0.1:5179` erscheint,
   diese Adresse im Browser öffnen (Lesezeichen anlegen).
6. **Beenden:** im PowerShell-Fenster **Strg+C** drücken. Solange das Fenster offen ist, läuft
   PL-Cockpit; das Fenster kann minimiert werden.

## Daten und Backup

7. Alle Daten liegen in **einer Datei**: `%APPDATA%\pl-cockpit\pl-cockpit.db`
   (im Explorer `%APPDATA%\pl-cockpit` in die Adresszeile eingeben).
   **Backup** = diese Datei kopieren, am besten bei beendetem PL-Cockpit, z. B. in deinen
   OneDrive-/Home-Ordner. **Wiederherstellen** = Datei zurückkopieren.
   Die Datei liegt bewusst **nicht** im Code-Ordner, damit Updates sie nie überschreiben und sie nie
   ins Git-Repository gelangt.

## Update auf eine neue Version

8. PL-Cockpit beenden (Strg+C), dann:
   - **Mit Git:** `git pull` und danach `npm install`
   - **Mit ZIP:** neues ZIP entpacken (alten Code-Ordner ersetzen), dann `npm install`
9. `npm start` – neue Datenbank-Änderungen werden beim Start automatisch angewendet, deine Daten
   bleiben erhalten.

## Häufige Probleme

| Meldung | Lösung |
|---|---|
| `npm : Die Datei …\npm.ps1 kann nicht geladen werden, da die Ausführung von Skripts auf diesem System deaktiviert ist` | PowerShell blockiert Skripte. Entweder statt PowerShell die **Eingabeaufforderung (cmd)** verwenden, oder einmalig `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` ausführen (falls die Firmenrichtlinie es erlaubt). |
| `Port 5179 ist bereits belegt …` | PL-Cockpit läuft schon in einem anderen Fenster – dort weiterverwenden oder mit Strg+C beenden. |
| `npm install` hängt oder meldet `ETIMEDOUT` / `ECONNREFUSED` | Firmen-Proxy. Proxy-Adresse bei der IT erfragen und setzen: `npm config set proxy http://proxy:port` und `npm config set https-proxy http://proxy:port` |
| `node` wird nicht gefunden | Nach der Node-Installation ein **neues** PowerShell-Fenster öffnen. |
| Browser zeigt „Server nicht erreichbar“ | Das PowerShell-Fenster mit `npm start` wurde geschlossen – neu starten (Schritt 5). |

## Optionale Einstellungen

Über Umgebungsvariablen vor `npm start` (PowerShell-Syntax):

- Anderer Port: `$env:PL_COCKPIT_PORT = "5200"`
- Anderer Datenordner: `$env:PL_COCKPIT_DATA_DIR = "D:\Daten\pl-cockpit"`
