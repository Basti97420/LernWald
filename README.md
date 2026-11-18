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

Die Karte liegt außerdem blass als Hintergrund hinter der Stapelübersicht von Anki (abschaltbar, Deckkraft
einstellbar). Sie wird neu berechnet, sobald sich die Sammlung ändert.
Öffnet man einen Stapel, liegt dort sein eigenes Gebiet als Hintergrund: der Wald bzw. die Stadt nur aus den
Karten dieses Stapels.

### Bewegung

Nach dem Vorbild von Capriccio (emollick, MIT; kein Code übernommen) bewegen sich die Bilder: Vögel ziehen mit
Flügelschlag, Bewohner gehen wippend hin und her, Wolken treiben, Sterne funkeln, Laternen flackern, Wimpel wehen,
im Wald wiegen sich die Bäume, Regen fällt. Beim Öffnen eines Gebiets wachsen Bäume bzw. Häuser nacheinander aus
dem Boden. Alles in `web/bewegung.css`, Dauer und Versatz je Element setzt `lernwald.js`. Abschaltbar in den
Einstellungen; bei „weniger Bewegung“ im System steht alles still.

Öffnen über **Werkzeuge → Lernwald** oder den Knopf in der oberen Leiste. Einstellungen über den Knopf im
Fenster oder **Werkzeuge → Add-ons → Lernwald → Einstellungen**.

### Stadt von oben

Die Stadt (und die Tusche-Stadt) zeigt ein Gebiet isometrisch von oben (`web/iso-stadt.js`): Vom Marktplatz
mit den Sehenswürdigkeiten wächst sie in alle Richtungen, Häuser stehen auf Parzellen zwischen einem
Straßengitter (jede dritte Reihe ist Straße), die größten in der Mitte. Mausrad zoomt, Ziehen verschiebt,
Doppelklick stellt zurück. Nachts leuchten Fenster. Mit der Zahl reifer Häuser wächst das Leben:

| reife Häuser | dazu |
|---|---|
| immer | Einwohner auf den Straßen, je größer die Stadt, desto mehr (höchstens 70), dazu die Wiederholungen von heute |
| ab 15 (Dorf) | gepflasterte Straßen mit Kutschen |
| ab 60 (Kleinstadt) | Eisenbahn hinter der Stadt |
| ab 150 (Stadt) | Straßenbahn auf den Hauptstraßen, Bahnhof, längere Züge |
| ab 300 (Großstadt) | zweiter Zug in Gegenrichtung, dichter Verkehr |

Die Lerntage bauen wie bisher Laternen, Bänke, Stadtmauer (im Quadrat mit Toren und Ecktürmen) und Aquädukt.
Fahrzeuge fahren jeweils zwei Blöcke weit und tauchen an den Enden auf und ab, damit sie richtig zwischen
den Häusern liegen. Die letzte Fassung als Seitenansicht ist Commit `8be8de6`.

### Tusche-Stadt

Drittes Thema: dieselbe Stadt, gezeichnet wie ein Kupferstich (Vorbild für den Stil: Capriccio von emollick,
MIT; davon ist kein Code übernommen). `web/thema-tusche.js` nimmt die Zeichnungen der Stadt und ersetzt jede
Füllfarbe nach ihrer Helligkeit durch Papier oder eine von vier Schraffuren, Linien werden Tusche, Schatten
schraffiert, der Himmel waagrecht liniert. Ein SVG-Filter (`feTurbulence` + `feDisplacementMap`) lässt die
Striche leicht zittern. Die Sehenswürdigkeiten sind dieselben wie in der Stadt.

### Statistik im Bild

`daten.chronik_berechnen` liest das revlog (ohne manuelle Einträge) mit Ankis Tagesgrenze:

| Statistik | im Bild |
|---|---|
| Lerntage im Gebiet | Ausbau: Stadt je 7 Tage eine Laterne, je 30 eine Bank, ab 100 Stadtmauer, ab 200 Aquädukt; Wald je 3 Tage eine Blume, je 30 eine Bank |
| Serie im Gebiet ab 7 Tagen | Wimpelkette über dem Platz |
| Wiederholungen heute im Gebiet | so viele Bewohner bzw. Wanderer (höchstens 30) |
| Trefferquote 30 Tage im Gebiet | Wetter: ab 90 % Sonne, ab 80 % Wolken, darunter Regen |
| meist gelernt um (ganze Sammlung) | Licht: Morgen, Tag, Abend (Abendhimmel), Nacht (Mond und Sterne) |
| Lerntage der letzten 53 Wochen | Reiter „Chronik“: Pflasterstraße, ein Stein je Tag, dunkler bei mehr Wiederholungen, Lücke mit Gras ohne Lernen |
| Meilensteine (Wiederholungen, Lerntage, Serie) | Denkmäler mit Datum in der Chronik |

Die Chronik zeigt außerdem Serie, Lerntage, Wiederholungen, heute (Minuten, neue Karten), morgen fällig,
Trefferquote und eine Tabelle je Gebiet.

Alle Grafiken sind SVG, im Code gezeichnet, keine fremden Bilder.

## Aufbau

- `lernwald/` – das Add-on, so wie es in Anki landet
  - `daten.py` – Berechnung aus der Sammlung, Themen mit ihren Belohnungen (ohne Qt, getestet)
  - `ansicht.py` – Fenster mit Webansicht, Album
  - `einstellungen.py` – Dialog für Thema und Gebiete
  - `web/grundlagen.js` – gemeinsame Hilfen; `web/thema-wald.js`, `web/thema-stadt.js` – Zeichnungen, Texte
    und Anordnung je Thema; `web/thema-tusche.js` – zeichnet die Stadt als Kupferstich nach (`nachbearbeiten`,
    `defs`); `web/iso-stadt.js` – die Stadt von oben (`szene`); `web/lernwald.js` – Karte, Gebiet, Chronik,
    Album, Wetter und Bewohner, Zoomen
- `werkzeuge/` – Beispielsammlung, HTML-Vorschau, Paketieren, Test-Add-on für ein echtes Anki
- `tests/` – Tests für `daten.py`

Ein neues Thema braucht einen Eintrag in `THEMEN` (`daten.py`, Belohnungen mit Kennungen, die es noch nicht
gibt), eine Datei `web/thema-NAME.js` mit denselben Feldern wie `thema-wald.js`, einen Eintrag in `SKRIPTE`
(`ansicht.py`) und einen Text in `THEMENTEXT` (`einstellungen.py`). Optional: `ausbau`, `ausbauText`,
`bewohner`, `leuteText`, `pflasterTitel`, `nachbearbeiten` und `defs` (siehe `thema-tusche.js`), `szene` für
eine eigene Ansicht eines Gebiets (siehe `iso-stadt.js`, dann entfallen `plaetze`, `vorne` und `ausbau`).

## Entwickeln

```sh
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt   # anki + aqt (Anki 26.09 samt Qt)
.venv/bin/python -m unittest discover tests                              # Tests
.venv/bin/python werkzeuge/vorschau.py /tmp/vorschau.html tusche         # Vorschau ohne Anki (wald, stadt, tusche)
.venv/bin/python werkzeuge/paketieren.py                                 # dist/lernwald-<version>.ankiaddon
```

Vorschau: `vorschau.html#3` öffnet Gebiet 3, `#chronik` die Chronik, `#album` das Album. Die Beispielsammlung
hat einen Lernverlauf von 240 Tagen (Chemie seit 20 Tagen ohne Lernen, Spanisch nie gelernt).

Test im echten Anki ohne Bildschirm: siehe `werkzeuge/ankitest/LIESMICH.md`.

## Veröffentlichen

AnkiWeb verlangt AGPL-3.0 oder eine verträgliche Lizenz (Nutzungsbedingungen, Abschnitt „Sharing Add-ons“).
Paket bauen und unter <https://ankiweb.net/shared/addons> hochladen. `version` in `lernwald/manifest.json` hochzählen.

## Lizenz

GNU AGPL-3.0-or-later, siehe `LICENSE`. Copyright (C) 2026 Basti97420.
