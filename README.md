# Lernwald

Ein Add-on für [Anki](https://apps.ankiweb.net), das deinen Lernstand als Landschaft zeigt, die mit dem Lernen
wächst: als **Stadt** (bunt oder als Kupferstich in Tusche) oder als **Wald**.

Jeder Stapel wird ein Gebiet, jede Karte ein Haus bzw. ein Baum. Neue Karten sind Bauplätze, gut gelernte
werden Stadthäuser, und Karten, die du lange immer wieder richtig weißt, wachsen zu Hochhäusern und
Wolkenkratzern. Je mehr gut gelernte Häuser, desto mehr Einwohner: Leute auf den Straßen, Kutschen und Autos,
Straßenbahnen und Züge. Die Stadtmauer wird massiver, je sicherer der Stapel sitzt. Fällige Karten lassen
die Stadt verwildern, gesunde Gebiete bekommen Sehenswürdigkeiten bzw. Tiere. Im Wald wachsen Bäume, Tiere
ziehen ein.

- die Stadt von oben, zum Zoomen und Verschieben; überall Bewegung (Vögel, Wolken, Verkehr, Wetter, Wind)
- in der Stadt unter jedem Gebiet: wie weit es bis zur nächsten Größe ist und welche Häuser bald aufsteigen
- die Landschaft blass als Hintergrund der Stapelübersicht und hinter dem geöffneten Stapel
- Chronik deiner Lerntage und ein Album mit allem, was du schon freigeschaltet hast

Alle Bilder sind im Code gezeichnet, ohne fremde Grafiken.

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
