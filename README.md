# Lernwald

Ein Add-on für [Anki](https://apps.ankiweb.net), das deinen Lernstand als Landschaft zeigt, die mit dem Lernen
wächst: als **Stadt** oder als **Wald**.

Jeder Stapel wird ein Gebiet, jede Karte ein Haus bzw. ein Baum. Neue Karten sind Bauplätze, gut gelernte
werden Stadthäuser, und Karten, die du lange immer wieder richtig weißt, wachsen zu Hochhäusern und
Wolkenkratzern. Je mehr gut gelernte Häuser, desto mehr Einwohner: Leute auf den Straßen, Kutschen und Autos,
Straßenbahnen und Züge. Die Stadtmauer wird massiver, je sicherer der Stapel sitzt. Fällige Karten lassen
die Stadt verwildern, gesunde Gebiete bekommen Sehenswürdigkeiten. Der Wald kann dasselbe mit Bäumen: vom
Sprössling bis zum Urwaldriesen, mit Wanderern und Tieren, Reitern, Waldbahn und Hecken statt Mauern.

- Stadt und Wald von oben, zum Zoomen und Verschieben; überall Bewegung (Vögel, Wolken, Verkehr, Wetter, Wind)
- unter jedem Gebiet: wie weit es bis zur nächsten Größe ist und welche Häuser bzw. Bäume bald aufsteigen
- die Landschaft blass als Hintergrund der Stapelübersicht und hinter dem geöffneten Stapel
- ist Anki nicht im Vordergrund, steht alles still und kostet keine Rechenleistung
- Chronik deiner Lerntage und ein Album mit allem, was du schon freigeschaltet hast

Alle Bilder sind im Code gezeichnet, ohne fremde Grafiken.

## So wächst die Stadt

**Jede Karte ist ein Gebäude.** Was daraus wird, hängt von ihrem Intervall und davon ab, wie oft sie vergessen wurde:

| Karte | Gebäude | Einwohner |
|---|---|---|
| neu | Bauplatz | 0 |
| in der Lernphase | Baustelle | 0 |
| Intervall unter 21 Tagen | Hütte | 1 |
| ab 21 Tagen (reif) | Haus | 3 |
| ab 90 Tagen, höchstens 1× vergessen | Stadthaus oder Turm | 6 |
| ab 180 Tagen, höchstens 1× vergessen | Hochhaus | 12 |
| ab 365 Tagen, nie vergessen | hohes Hochhaus | 25 |
| ab 730 Tagen, nie vergessen | Wolkenkratzer | 50 |
| 8× vergessen oder Leech | baufälliges Haus | 1 |
| ausgesetzt | Ruine | 0 |

Ist eine Karte fällig, wuchert Unkraut ums Haus und es zählt nur die Hälfte seiner Einwohner. Die größten
Gebäude stehen in der Mitte, die Stadt wächst vom Marktplatz aus in alle Richtungen.

**Die Einwohner bestimmen Größe und Leben:**

| Einwohner | Größe | kommt dazu |
|---|---|---|
| unter 50 | Weiler | Leute auf den Straßen (eine Figur je 20 Einwohner) |
| ab 50 | Dorf | gepflasterte Straßen mit Kutschen |
| ab 300 | Kleinstadt | Eisenbahn |
| ab 600 | | erste Autos, danach immer mehr statt Kutschen |
| ab 1.000 | Stadt | Straßenbahn und Bahnhof |
| ab 1.500 | | zweiter Zug (dritter ab 2.700, vierter ab 3.900) |
| ab 3.000 | Großstadt | |
| ab 8.000 | Metropole | |

Mit den Einwohnern wächst alles weiter: mehr Leute, Fahrzeuge und Straßenbahnen, längere Züge.

**Die Stadtmauer** zeigt, wie sicher der Stapel sitzt, also welcher Anteil der Karten reif ist (Intervall ab
21 Tagen): ab 15 % Holzpalisade, ab 35 % niedrige Steinmauer, ab 55 % Mauer mit Zinnen und Ecktürmen, ab 75 %
hohe Mauer mit Tortürmen, ab 90 % doppelter Mauerring mit Wassergraben.

**Lerntage** im Stapel bauen mit: je 7 Tage eine Laterne, je 30 Tage eine Bank, ab 200 Tagen ein Aquädukt.
Ab 7 Tagen Lernserie hängen Wimpel über dem Marktplatz.

**Zustand und Sehenswürdigkeiten:** Jedes Gebiet ist *lebendig*, *wächst* oder *verfällt*, je nachdem, wie viele
Karten reif sind und wie viele fällig oder baufällig. Lebendige Gebiete mit mindestens 10 reifen Karten
bekommen Sehenswürdigkeiten auf den Marktplatz. Welche, hängt davon ab, wie viele deiner Gebiete lebendig sind:

| lebendige Gebiete | Sehenswürdigkeiten |
|---|---|
| 1 | Dorfbrunnen, Marktstand |
| 2 | Maibaum, Windmühle |
| 3 | Kapelle, Rathaus |
| 4 | Uhrturm |
| 5 | Stadttor |
| 6 | Kirche |
| 7 | Burg |
| 8 | Dom |
| 10 | Schloss |

Außerdem: Die Trefferquote der letzten 30 Tage macht das Wetter (ab 90 % Sonne, ab 80 % Wolken, darunter Regen),
und die Tageszeit, zu der du meistens lernst, das Licht. Nachts leuchten die Fenster.

Im Fenster steht unter jedem Gebiet, wie weit es bis zur nächsten Größe ist, was als Nächstes kommt und welche
Häuser beim nächsten richtigen Wiederholen voraussichtlich aufsteigen.

## Und der Wald?

Der Wald wächst nach genau denselben Regeln und Zahlen, nur mit anderen Bildern:

| Stadt | Wald |
|---|---|
| Bauplatz, Baustelle, Hütte, Haus, Stadthaus | Sprössling, Setzling, junger Baum, Baum, dicker alter Baum |
| Hochhaus, hohes Hochhaus, Wolkenkratzer | Riesenbaum, Mammutbaum, Urwaldriese |
| baufälliges Haus, Ruine | kranker Baum, Baumstumpf |
| Weiler, Dorf, Kleinstadt, Stadt, Großstadt, Metropole | Gehölz, Wäldchen, Wald, Forst, großer Forst, Urwald |
| Leute auf den Straßen | Wanderer und Tiere auf den Waldwegen |
| Kutschen, Autos, Straßenbahn | Reiter, Radfahrer, Holzfuhrwerke |
| Eisenbahn und Bahnhof | Waldbahn und Försterei |
| Holzpalisade bis doppelter Mauerring mit Wassergraben | Weidenzaun, Trockenmauer, Hecke mit Hochsitzen, hohe Hecke mit Aussichtstürmen, doppelte Hecke mit Bach |
| Sehenswürdigkeiten auf dem Marktplatz | Tiere auf der Lichtung, von der Kohlmeise (1 lebendiges Gebiet) bis zum Wolf (10) |
| Laternen (je 7 Lerntage), Bänke, Aquädukt | Blumen (je 3 Lerntage), Bänke, Waldsee (ab 200 Lerntagen) |
| nachts leuchtende Fenster | nachts Glühwürmchen |

## Installieren

Voraussetzung: Anki 23.10 oder neuer.

**Über AnkiWeb:** In Anki **Extras → Add-ons → Add-ons herunterladen** wählen, den Code von der
AnkiWeb-Seite des Add-ons eingeben und Anki neu starten.

**Aus der Datei:** Das Paket lässt sich aus diesem Repository bauen (nur Python 3 nötig, keine weiteren
Pakete):

```sh
git clone https://github.com/Basti97420/LernWald.git
cd LernWald
python3 werkzeuge/paketieren.py      # legt dist/lernwald-<version>.ankiaddon an
```

Dann in Anki **Extras → Add-ons → Aus Datei installieren…** die `.ankiaddon`-Datei wählen (oder sie doppelt
anklicken) und Anki neu starten.

Danach öffnet der Knopf **Stadt** bzw. **Wald** in der oberen Leiste die Ansicht. Thema, Gebiete und Hintergrund
stellst du unter **Extras → Add-ons → Lernwald → Einstellungen** ein.

## Lizenz

GNU AGPL-3.0-or-later, siehe [LICENSE](LICENSE). Copyright (C) 2026 Basti97420.
