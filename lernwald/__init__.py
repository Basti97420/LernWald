# Lernwald – Anki-Add-on
# Copyright (C) 2026 Basti97420
# Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
"""Einstieg: Menüpunkt, Knopf in der oberen Leiste, Einstellungen."""

from aqt import gui_hooks, mw
from aqt.qt import QAction

from . import ansicht, einstellungen


def _oeffnen():
    ansicht.zeigen()


def _leiste(links, toolbar):
    links.append(toolbar.create_link("lernwald", "Lernwald", _oeffnen, tip="Lernwald öffnen", id="lernwald"))


def _einrichten():
    aktion = QAction("Lernwald", mw)
    aktion.triggered.connect(_oeffnen)
    mw.form.menuTools.addAction(aktion)
    mw.addonManager.setConfigAction(__name__, einstellungen.zeigen)
    mw.addonManager.setWebExports(__name__, r"web/.*\.(js|css)")
    gui_hooks.top_toolbar_did_init_links.append(_leiste)


if mw is not None:  # beim Testen ohne laufendes Anki nichts einrichten
    _einrichten()
