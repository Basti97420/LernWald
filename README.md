# Lernwald

Anki-Add-on, das den Lernstand als Landschaft zeigt. Jedes Gebiet ist ein Stapel, ein Schlagwort (samt
Unter-Schlagwörtern) oder eine Anki-Suche, festgelegt in den Einstellungen. Dort wird auch das Thema gewählt:

| Karte | Thema Wald | Thema Stadt |
|---|---|---|
| neu | Sprössling | Bauplatz |
| in der Lernphase | Setzling | Baustelle |
| Intervall unter 21 Tagen | junger Baum | Hütte |
| ab 21 Tagen (reif) | Baum | Haus |
| ab 90 Tagen, höchstens einmal vergessen | dicker alter Baum | Stadthaus oder Turm |
| 8-mal vergessen oder Leech | kranker Baum | baufälliges Haus |
| ausgesetzt | Baumstumpf | Ruine |
| fällig | welkes Laub | ungepflegt, Unkraut |

Die Gesamtansicht ist eine Karte mit allen Gebieten und ihren Namen. Gesunde Gebiete (viele reife Karten,
wenig Fälliges) bekommen Belohnungen: im Wald Tiere, in der Stadt Sehenswürdigkeiten (Dorfbrunnen bis Schloss).
Je mehr Gebiete gesund sind, desto seltenere. In der Stadt zeigt jedes Gebiet außerdem seine Größe
(Weiler, Dorf, Kleinstadt, Stadt, Großstadt); große Häuser stehen in der Mitte, Bauplätze am Rand.
Erstsichtungen landen im Album (`user_files/album.json`, bleibt bei Updates erhalten).

Öffnen über **Werkzeuge → Lernwald** oder den Knopf in der oberen Leiste. Einstellungen über den Knopf im
Fenster oder **Werkzeuge → Add-ons → Lernwald → Einstellungen**.

Alle Grafiken sind SVG, im Code gezeichnet, keine fremden Bilder.

## Aufbau

- `lernwald/` – das Add-on, so wie es in Anki landet
  - `daten.py` – Berechnung aus der Sammlung, Themen mit ihren Belohnungen (ohne Qt, getestet)
  - `ansicht.py` – Fenster mit Webansicht, Album
  - `einstellungen.py` – Dialog für Thema und Gebiete
  - `web/grundlagen.js` – gemeinsame Hilfen; `web/thema-wald.js`, `web/thema-stadt.js` – Zeichnungen, Texte
    und Anordnung je Thema; `web/lernwald.js` – Karte, Gebiet, Album
- `werkzeuge/` – Beispielsammlung, HTML-Vorschau, Paketieren, Test-Add-on für ein echtes Anki
- `tests/` – Tests für `daten.py`

Ein neues Thema braucht einen Eintrag in `THEMEN` (`daten.py`, Belohnungen mit Kennungen, die es noch nicht
gibt), eine Datei `web/thema-NAME.js` mit denselben Feldern wie `thema-wald.js`, einen Eintrag in `SKRIPTE`
(`ansicht.py`) und einen Text in `THEMENTEXT` (`einstellungen.py`).

## Entwickeln

```sh
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt   # anki + aqt (Anki 26.09 samt Qt)
.venv/bin/python -m unittest discover tests                              # Tests
.venv/bin/python werkzeuge/vorschau.py /tmp/vorschau.html stadt          # Vorschau ohne Anki (wald oder stadt)
.venv/bin/python werkzeuge/paketieren.py                                 # dist/lernwald-<version>.ankiaddon
```

Vorschau: `vorschau.html#3` öffnet Gebiet 3, `#album` das Album.

Test im echten Anki ohne Bildschirm: siehe `werkzeuge/ankitest/LIESMICH.md`.

## Veröffentlichen

AnkiWeb verlangt AGPL-3.0 oder eine verträgliche Lizenz (Nutzungsbedingungen, Abschnitt „Sharing Add-ons“).
Paket bauen und unter <https://ankiweb.net/shared/addons> hochladen. `version` in `lernwald/manifest.json` hochzählen.

## Lizenz

GNU AGPL-3.0-or-later, siehe `LICENSE`. Copyright (C) 2026 Basti97420.
