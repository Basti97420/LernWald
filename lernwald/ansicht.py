# Lernwald – Anki-Add-on
# Copyright (C) 2026 Basti97420
# Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
"""Fenster mit der Waldkarte."""

import datetime
import json
import os

from aqt import mw
from aqt.qt import QDialog, QVBoxLayout
from aqt.utils import restoreGeom, saveGeom
from aqt.webview import AnkiWebView

from . import daten

ORDNER = os.path.dirname(__file__)
ALBUM = os.path.join(ORDNER, "user_files", "album.json")
SKRIPTE = ("grundlagen.js", "thema-wald.js", "thema-stadt.js", "lernwald.js")  # Reihenfolge wichtig

_fenster = None


def album_laden():
    try:
        with open(ALBUM, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def album_speichern(album):
    os.makedirs(os.path.dirname(ALBUM), exist_ok=True)
    with open(ALBUM, "w", encoding="utf-8") as f:
        json.dump(album, f, ensure_ascii=False, indent=1)


def berechnen():
    wald = daten.wald_berechnen(mw.col, mw.addonManager.getConfig(__name__))
    album = album_laden()
    wald["neu"] = daten.album_ergaenzen(album, wald["gesichtet"], datetime.date.today().isoformat())
    if wald["neu"]:
        album_speichern(album)
    wald["album"] = album
    return wald


class Fenster(QDialog):
    def __init__(self):
        super().__init__(mw)
        self.setWindowTitle("Lernwald")
        self.web = AnkiWebView(self, title="lernwald")
        self.web.set_bridge_command(self._befehl, self)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.addWidget(self.web)
        self.resize(1100, 760)
        restoreGeom(self, "lernwald")
        self.laden()

    def laden(self):
        pfad = "/_addons/%s/web/" % mw.addonManager.addonFromModule(__name__)
        roh = json.dumps(berechnen(), ensure_ascii=False).replace("</", "<\\/")
        self.web.stdHtml(
            '<div id="lernwald"></div><script type="application/json" id="lernwald-daten">%s</script>' % roh,
            css=[pfad + "lernwald.css"],
            js=[pfad + d for d in SKRIPTE],
            context=self,
            default_css=False,
        )

    def _befehl(self, cmd):
        if cmd == "lernwald:einstellungen":
            from . import einstellungen
            if einstellungen.zeigen():
                self.laden()
        elif cmd == "lernwald:neu":
            self.laden()

    def reject(self):
        saveGeom(self, "lernwald")
        global _fenster
        _fenster = None
        self.web.cleanup()
        super().reject()


def zeigen():
    global _fenster
    if _fenster is None:
        _fenster = Fenster()
    else:
        _fenster.laden()
    _fenster.show()
    _fenster.raise_()
    _fenster.activateWindow()
