"""Test-Add-on: füllt das Testprofil, öffnet Lernwald und speichert Bildschirmfotos. Nur für Tests."""

import os
import sys

from aqt import gui_hooks, mw
from aqt.qt import QTimer

ZIEL = os.environ.get("LERNWALD_FOTOS", "/tmp")
PRAEFIX = os.environ.get("LERNWALD_PRAEFIX", "anki-")
CFG = os.environ.get("LERNWALD_CFG")  # JSON: Einstellungen, die vor dem Öffnen gesetzt werden
sys.path.insert(0, os.environ["LERNWALD_WERKZEUGE"])


# Misst 3 Sekunden lang Bilder pro Sekunde und das längste Stocken (ms); Ergebnis in window.__lwMessung
MESSEN = """window.__lwMessung = null; (function () { let n = 0, max = 0, last = performance.now(); const t0 = last;
  function f(t) { n++; max = Math.max(max, t - last); last = t;
    if (t - t0 < 3000) requestAnimationFrame(f); else window.__lwMessung = n / ((t - t0) / 1000) + " Bilder/s, längstes Stocken " + Math.round(max) + " ms"; }
  requestAnimationFrame(f); })();"""


def _messung(web, name):
    web.evalWithCallback("window.__lwMessung", lambda m: print("MESSUNG", name, m, flush=True))


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
    w = None
    mw.deckBrowser.refresh()

    def schritt1():
        _foto(mw, "stapel.png")  # Stapelübersicht mit der Karte als Hintergrund
        name = os.environ.get("LERNWALD_STAPEL", "Arbeit")
        mw.col.decks.select(mw.col.decks.id_for_name(name))
        mw.moveToState("overview")  # geöffneter Stapel: sein Gebiet als Hintergrund
        QTimer.singleShot(1500, lambda: mw.web.eval(MESSEN))
        QTimer.singleShot(5000, schritt1b)

    def schritt1b():
        _messung(mw.web, "Stapel")
        _foto(mw, "stapel-offen.png")
        mw.web.evalWithCallback("document.getAnimations().length",
                                lambda n: print("ANIMATIONEN Stapel", n, flush=True))
        mw.moveToState("deckBrowser")
        ansicht.zeigen()
        QTimer.singleShot(6000, schritt2)

    def schritt2():
        nonlocal w
        w = ansicht._fenster
        _foto(w, "karte.png")
        w.web.eval("lernwald.zeigeGebiet(3)")
        QTimer.singleShot(2500, schritt3)

    def schritt3():
        _foto(w, "gebiet.png")
        w.web.evalWithCallback("document.getAnimations().length",
                               lambda n: print("ANIMATIONEN Gebiet", n, flush=True))
        w.web.evalWithCallback("[...document.querySelectorAll('.gebietinfo p, .fortschritt')].map((e) => e.innerText).join(' | ')",
                               lambda t: print("INFO", t, flush=True))
        w.web.eval(MESSEN)
        QTimer.singleShot(4000, schritt3b)

    def schritt3b():
        _messung(w.web, "Gebiet")
        _foto(w, "gebiet-spaeter.png")  # 4 Sekunden später: Züge, Kutschen und Leute sind weitergezogen
        # Pause: Anki geht in den Hintergrund (vorgetäuscht), die Ansicht muss anhalten, danach weiterlaufen
        frage = "document.getElementById('lernwald').classList.contains('lw-pause')"
        echt = ansicht._im_vordergrund
        ansicht._im_vordergrund = lambda: False
        ansicht.anwendung_zustand()
        w.web.evalWithCallback(frage, lambda an: print("PAUSE im Hintergrund", an, flush=True))
        ansicht._im_vordergrund = lambda: True
        ansicht.anwendung_zustand()
        w.web.evalWithCallback(frage, lambda an: print("PAUSE im Vordergrund", an, flush=True))
        ansicht._im_vordergrund = echt
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
        print("KNOPF", sys.modules["lernwald"]._aktion.text(), flush=True)  # Menüpunkt heißt wie das Thema
        w.reject()
        mw.close()

    QTimer.singleShot(5000, schritt1)


gui_hooks.profile_did_open.append(lambda: QTimer.singleShot(500, _start))
