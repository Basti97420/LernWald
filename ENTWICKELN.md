# Lernwald – für Entwickler

Wie das Add-on rechnet und zeichnet, Aufbau, Befehle, Veröffentlichen. Für Nutzer siehe `README.md`.

Das Add-on zeigt den Lernstand als Landschaft. Jedes Gebiet ist ein Stapel, ein Schlagwort (samt
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
Flügelschlag, Bewohner gehen wippend hin und her, Wolken treiben, Laternen flackern, nachts blinken Glühwürmchen und Antennenlichter, Wimpel wehen,
im Wald wiegen sich die Bäume, Regen fällt. Beim Öffnen eines Gebiets wachsen Bäume bzw. Häuser nacheinander aus
dem Boden. Alles in `web/bewegung.css`, Dauer und Versatz je Element setzt `lernwald.js`. Abschaltbar in den
Einstellungen; bei „weniger Bewegung“ im System steht alles still. Ist Anki nicht im Vordergrund, hält alles an
und läuft danach an derselben Stelle weiter (`anwendung_zustand` in `ansicht.py`, Klasse `lw-pause`).

**Last** (gemessen 18.11.2026, `MESSUNG` im Anki-Test, dazu im Browser auf dem Mac): Auf dem Mac läuft auch ein
großer Wald mit 60 Bildern/s; die Bewegung kostet dabei etwa ein Viertel eines Kerns im Hauptfaden des Browsers.
Kaum Wirkung hatten: Ruhendes als Bilder und Bewegtes als eigene HTML-Ebenen (Ebenen kosten selbst wieder),
verschachteltes Gruppieren, Gehen und Wippen in einer Animation. Die Last hängt an der Zahl der Animationen.

Öffnen über **Werkzeuge → Stadt** bzw. **Wald** oder den gleichnamigen Knopf in der oberen Leiste. Einstellungen über den Knopf im
Fenster oder **Werkzeuge → Add-ons → Lernwald → Einstellungen**.

### Ansicht von oben (Stadt und Wald)

Alle Themen zeigen ein Gebiet isometrisch von oben. `web/iso.js` ist die gemeinsame Zeichenmaschine (Raster,
Quader, Dächer, Wege, Leute, Fahrzeuge, Bahn, Mauerringe, Wetter, Ausschnitt); was gezeichnet wird, liefert
das Thema als Stil: `web/iso-stadt.js` (Häuser, Kutschen, Autos, Straßenbahn, Stadtmauer, Laternen, Aquädukt),
`web/iso-plantage.js` (Beete, Gewächshäuser, Vertical Farms, Schubkarren, Traktoren, Feldbahn, Zäune) und `web/iso-wald.js` (Bäume bis Urwaldriese, Wanderer und Tiere, Reiter, Radfahrer, Holzfuhrwerke, Waldbahn
mit Försterei, Hecken mit Hochsitzen, Blumen, Waldsee, Glühwürmchen). Vom Platz in der Mitte wächst das Gebiet
in alle Richtungen, Häuser bzw. Bäume stehen auf Parzellen zwischen einem Wegegitter (jede dritte Reihe ist
Weg), die größten in der Mitte. Mausrad zoomt, Ziehen verschiebt, Doppelklick stellt zurück.

Die Wachstumsregeln (Einwohner je Haus, Größe, Verkehr, Mauerstufen, Fortschrittstext) stehen einmal in
`web/grundlagen.js` (`LW.wachstum`, `LW.verkehr`, `LW.mauerStufe`, `LW.hausBewohner`); jedes Thema gibt nur
seine Wörter dazu (`WACHSTUM` in `thema-stadt.js` bzw. `thema-wald.js`). Die Zahlen unten gelten für beide.

**Hochhäuser:** Ein Stadthaus (Intervall ab 90 Tagen, höchstens einmal vergessen) wächst weiter, je öfter die Karte
hintereinander richtig war: ab 180 Tagen Intervall ein Hochhaus, ab 365 Tagen ohne Fehler ein hohes Hochhaus,
ab 730 Tagen ohne Fehler ein Wolkenkratzer aus Glas (`HOCH_AB` in `daten.py`). Die höchsten stehen in der Mitte.

**Einwohner** sind der Wachstumswert der Stadt (`bewohner` in `daten.py`): Hütte 1, Haus 3, Stadthaus 6,
Hochhaus 12, hohes Hochhaus 25, Wolkenkratzer 50, baufällig 1, Bauplatz, Baustelle und Ruine 0. Ein Haus mit
fälliger Karte zählt nur halb (die Leute bleiben zu Hause). Daraus folgen die Größe (Weiler, ab 50 Dorf, ab 300
Kleinstadt, ab 1.000 Stadt, ab 3.000 Großstadt, ab 8.000 Metropole) und das Leben auf den Straßen
(`verkehr` in `thema-stadt.js`):

| | wie viele |
|---|---|
| Leute auf den Straßen | eine Figur je 20 Einwohner, höchstens 160, dazu die Wiederholungen von heute; sie gehen neben ihren Häusern, die großen Häuser in der Mitte bringen am meisten Leben |
| Fahrzeuge (ab 50) | Einwohner ÷ 70, höchstens 40; ab 600 werden immer mehr davon Autos statt Kutschen (bis 90 %) |
| Straßenbahnen (ab 1.000) | 1, dann eine mehr je 600 Einwohner, höchstens 8; dazu ein Bahnhof |
| Züge (ab 300) | 1, dann einer mehr je 1.200 Einwohner, höchstens 4, abwechselnd in beide Richtungen; 3 bis 8 Wagen |

Unter dem Bild (nur im Fenster, nicht im Hintergrund) steht ein Fortschrittsbalken bis zur nächsten Größe, was als
Nächstes dazukommt, die Mauer und eine Schätzung, welche Häuser beim nächsten richtigen Wiederholen aufsteigen
(Intervall × Ease, `aufstieg` in `daten.py`). Knopf in der oberen Leiste und Menüpunkt heißen wie das Thema
(„Stadt“ bzw. „Wald“).

**Stadtmauer** nach der Sicherheit des Gebiets, also dem Anteil reifer Karten an allen (ohne ausgesetzte):
ab 15 % Holzpalisade, ab 35 % niedrige Steinmauer, ab 55 % Mauer mit Zinnen und Ecktürmen, ab 75 % hohe Mauer mit
Tor- und Zwischentürmen, ab 90 % doppelter Mauerring mit Wassergraben und Brücken.

Die Lerntage bauen Laternen, Bänke und ab 200 ein Aquädukt. Fahrzeuge fahren jeweils zwei Blöcke weit und
tauchen an den Enden auf und ab, damit sie richtig zwischen den Häusern liegen. Die letzte Fassung als
Seitenansicht ist Commit `8be8de6`.

Die Tusche-Stadt (Kupferstich-Stil) gab es bis 0.9.0; eingestellt wird sie seitdem zur Stadt (gleiche
Sehenswürdigkeiten, das Album bleibt).

### Statistik im Bild

`daten.chronik_berechnen` liest das revlog (ohne manuelle Einträge) mit Ankis Tagesgrenze:

| Statistik | im Bild |
|---|---|
| Lerntage im Gebiet | Ausbau: Stadt je 7 Tage eine Laterne, je 30 eine Bank, ab 200 Aquädukt; Wald je 3 Tage eine Blume, je 30 eine Bank |
| Serie im Gebiet ab 7 Tagen | Wimpelkette über dem Platz |
| Wiederholungen heute im Gebiet | so viele Leute zusätzlich auf den Wegen (höchstens 30) |
| Trefferquote 30 Tage im Gebiet | Wetter: ab 90 % Sonne, ab 80 % Wolken, darunter Regen |
| meist gelernt um (ganze Sammlung) | Licht: abends etwas dunkler, nachts dunkel mit leuchtenden Fenstern bzw. Glühwürmchen |
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
  - `web/grundlagen.js` – gemeinsame Hilfen und Wachstumsregeln; `web/thema-wald.js`, `web/thema-stadt.js`, `web/thema-plantage.js` –
    Bilder für Legende, Album und Karte, Texte und Wörter je Thema; `web/iso.js` – Ansicht von oben;
    `web/iso-stadt.js`, `web/iso-wald.js`, `web/iso-plantage.js` – ihr Stil je Thema (`szene`); `web/lernwald.js` – Karte, Gebiet, Chronik, Album,
    Vögel, Zoomen
- `werkzeuge/` – Beispielsammlung, HTML-Vorschau, Paketieren, Test-Add-on für ein echtes Anki
- `tests/` – Tests für `daten.py`

Ein neues Thema braucht einen Eintrag in `THEMEN` (`daten.py`, Belohnungen mit Kennungen, die es noch nicht
gibt), eine Datei `web/thema-NAME.js` mit denselben Feldern wie `thema-wald.js`, einen Eintrag in `SKRIPTE`
(`ansicht.py`), einen Text in `THEMENTEXT` (`einstellungen.py`), Wörter für `LW.wachstum` und einen Stil
für die Ansicht von oben (`web/iso-NAME.js` nach dem Muster von `iso-wald.js`, setzt `szene`). Optional:
`ausbauText`, `leuteText`, `pflasterTitel`.

## Entwickeln

```sh
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt   # anki + aqt (Anki 26.09 samt Qt)
.venv/bin/python -m unittest discover tests                              # Tests
.venv/bin/python werkzeuge/vorschau.py /tmp/vorschau.html stadt          # Vorschau ohne Anki (wald, stadt)
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
