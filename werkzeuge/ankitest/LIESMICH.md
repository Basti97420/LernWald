# Test im echten Anki (ohne Bildschirm)

Test-Add-on: füllt ein frisches Profil mit der Beispielsammlung, öffnet Lernwald, speichert Bildschirmfotos
(Karte, Gebiet, Album, Einstellungen), drückt „Speichern“ im Einstellungsdialog, gibt die gespeicherten
Einstellungen aus und beendet Anki. Nur zum Testen, nicht ins Paket.

```sh
B=/tmp/lw/base; rm -rf $B && mkdir -p $B/addons21
cp -r ~/work/LernWald/lernwald $B/addons21/lernwald   # kopieren, sonst schreibt Anki meta.json ins Repo
ln -s ~/work/LernWald/werkzeuge/ankitest $B/addons21/ankitest
QT_QPA_PLATFORM=offscreen QTWEBENGINE_CHROMIUM_FLAGS="--no-sandbox --disable-gpu" \
LERNWALD_FOTOS=/tmp/lw LERNWALD_WERKZEUGE=~/work/LernWald/werkzeuge \
timeout 90 ~/work/LernWald/.venv/bin/python ~/work/LernWald/werkzeuge/ankitest/start.py -b $B
```

Optional: `LERNWALD_CFG='{"thema": "stadt", "gebiete": [...]}'` setzt die Einstellungen vorher,
`LERNWALD_PRAEFIX=stadt-` ändert die Dateinamen der Fotos.

`start.py` überspringt die Sprachauswahl beim ersten Start (sonst wartet Anki ohne Bildschirm ewig).
