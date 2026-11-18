# Lernwald – Anki-Add-on
# Copyright (C) 2026 Basti97420
# Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
"""Einstieg: Menüpunkt, Knopf in der oberen Leiste, Einstellungen. Knopf und Menüpunkt heißen wie das Thema."""

from aqt import gui_hooks, mw
from aqt.qt import QAction

from . import ansicht, daten, einstellungen

_aktion = None


def _oeffnen():
    ansicht.zeigen()


def _beschriftung():
    cfg = daten.einstellungen(mw.addonManager.getConfig(__name__))
    return daten.THEMEN[cfg["thema"]].get("knopf", "Lernwald")


def beschriftung_aktualisieren():
    """Nach einem Themenwechsel: Knopf in der oberen Leiste und Menüpunkt neu beschriften."""
    if _aktion is not None:
        _aktion.setText(_beschriftung())
    mw.toolbar.draw()


def _leiste(links, toolbar):
    text = _beschriftung()
    links.append(toolbar.create_link("lernwald", text, _oeffnen, tip="%s öffnen (Lernwald)" % text, id="lernwald"))


def _einrichten():
    global _aktion
    _aktion = QAction(_beschriftung(), mw)
    _aktion.triggered.connect(_oeffnen)
    mw.form.menuTools.addAction(_aktion)
    mw.addonManager.setConfigAction(__name__, einstellungen.zeigen)
    mw.addonManager.setWebExports(__name__, r"web/.*\.(js|css)")
    gui_hooks.top_toolbar_did_init_links.append(_leiste)
    gui_hooks.webview_will_set_content.append(ansicht.hintergrund_einsetzen)
    mw.app.applicationStateChanged.connect(ansicht.anwendung_zustand)  # im Hintergrund steht alles still


if mw is not None:  # beim Testen ohne laufendes Anki nichts einrichten
    _einrichten()
