# LernWald – Anki-Add-on

Visualisiert Anki-Stapel als Wald oder Stadt (Idee des Nutzers vom 07.11.2026, Eintrag 115 im Info-Board).
Aufbau, Befehle, Regeln für die Stufen und wie ein neues Thema dazukommt stehen in `README.md`.

## Was Claude hier macht

- Das Add-on weiterbauen; Grafiken selbst als SVG zeichnen (keine fremden Bilder).
- Nach Änderungen: Tests, Vorschau mit Chromium ansehen, bei Qt-Änderungen der Test im echten Anki
  (`werkzeuge/ankitest/LIESMICH.md`). Fotos und Vorschau für den Nutzer nach `~/austausch/von-claude/lernwald/`.
- Paket mit `werkzeuge/paketieren.py` bauen und ebenfalls dort ablegen. Hochladen zu AnkiWeb macht der Nutzer.

## Zu beachten

- Lizenz AGPL-3.0-or-later (Pflicht für AnkiWeb). Jede Quelldatei trägt den Kopf mit Copyright Basti97420.
- Kennungen der Belohnungen (Tiere, Bauten) müssen über alle Themen eindeutig sein: das Album ist ein
  gemeinsames Wörterbuch (Test `test_belohnungen_eindeutig`).
- `daten.py` ohne Qt-Importe halten, damit die Tests ohne Anki-Fenster laufen.
- Das Add-on-Verzeichnis heißt nach Installation aus AnkiWeb wie die Nummer des Add-ons: Pfade nur über
  `__name__` / `addonFromModule` bilden, nie fest auf `lernwald`.
- Anki-Bibliotheken nur in der `.venv` (`requirements-dev.txt`).
- GitHub: <https://github.com/Basti97420/LernWald> (Remote `github` auf der VM, `git@github.com:…`).
  Pushen nur von der VM aus, der Mac hat keine GitHub-Zugangsdaten: Commit vom Mac mit
  `git push origin main:vom-mac` auf die VM, dort `git merge --ff-only vom-mac` und `git push github main`.
