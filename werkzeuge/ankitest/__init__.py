"""Test-Add-on: füllt das Testprofil, öffnet Lernwald und speichert Bildschirmfotos. Nur für Tests."""

import os
import sys

from aqt import gui_hooks, mw
from aqt.qt import QTimer

ZIEL = os.environ.get("LERNWALD_FOTOS", "/tmp")
PRAEFIX = os.environ.get("LERNWALD_PRAEFIX", "anki-")
CFG = os.environ.get("LERNWALD_CFG")  # JSON: Einstellungen, die vor dem Öffnen gesetzt werden
sys.path.insert(0, os.environ["LERNWALD_WERKZEUGE"])


def _foto(widget, name):
    widget.grab().save(os.path.join(ZIEL, PRAEFIX + name))
    print("FOTO", name, flush=True)


def _start():
    from beispiel import befuellen
    if not mw.col.find_cards(""):
        befuellen(mw.col)
    if CFG:
        import json
        mw.addonManager.writeConfig("lernwald", json.loads(CFG))
    ansicht = sys.modules["lernwald.ansicht"]
    ansicht.zeigen()
    w = ansicht._fenster

    def schritt2():
        _foto(w, "karte.png")
        w.web.eval("lernwald.zeigeGebiet(3)")
        QTimer.singleShot(2500, schritt3)

    def schritt3():
        _foto(w, "gebiet.png")
        w.web.eval("lernwald.zeigeAlbum()")
        QTimer.singleShot(2000, schritt4)

    def schritt4():
        _foto(w, "album.png")
        from lernwald.einstellungen import Einstellungen
        d = Einstellungen(w)
        d._zeile({"name": "Arbeit (alles)", "art": "schlagwort", "wert": "Arbeit"})
        d.show()
        QTimer.singleShot(1500, lambda: schritt5(d))

    def schritt5(d):
        import json
        _foto(d, "einstellungen.png")
        d._speichern()  # wie der Knopf „Speichern“
        print("GESPEICHERT", json.dumps(mw.addonManager.getConfig("lernwald"), ensure_ascii=False), flush=True)
        w.reject()
        mw.close()

    QTimer.singleShot(6000, schritt2)


gui_hooks.profile_did_open.append(lambda: QTimer.singleShot(500, _start))
