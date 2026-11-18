# Lernwald – Anki-Add-on
# Copyright (C) 2026 Basti97420
# Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
"""Einstellungen: Thema und welche Stapel, Schlagwörter oder Suchen ein Gebiet bilden."""

from aqt import mw
from aqt.qt import (
    QCheckBox, QComboBox, QDialog, QDialogButtonBox, QHBoxLayout, QHeaderView, QLabel, QLineEdit, QPushButton,
    QSpinBox, QTableWidget, QVBoxLayout,
)
from aqt.utils import askUser, disable_help_button, showWarning

from . import daten

ARTEN = (("stapel", "Stapel"), ("schlagwort", "Schlagwort"), ("suche", "Suche"))
THEMENTEXT = {"wald": "Wald – Bäume wachsen, Tiere ziehen ein",
              "stadt": "Stadt – Dörfer wachsen zur Stadt, Sehenswürdigkeiten entstehen"}


class Einstellungen(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent or mw)
        self.setWindowTitle("Lernwald – Einstellungen")
        disable_help_button(self)
        self.cfg = daten.einstellungen(mw.addonManager.getConfig(__name__))
        self.stapel = [d.name for d in mw.col.decks.all_names_and_ids(skip_empty_default=True)]
        self.schlagwoerter = sorted(mw.col.tags.all(), key=str.lower)

        lay = QVBoxLayout(self)
        zeile = QHBoxLayout()
        zeile.addWidget(QLabel("<b>Thema:</b>"))
        self.thema = QComboBox()
        for key in daten.THEMEN:
            self.thema.addItem(THEMENTEXT.get(key, daten.THEMEN[key]["name"]), key)
        self.thema.setCurrentIndex(list(daten.THEMEN).index(self.cfg["thema"]))
        zeile.addWidget(self.thema)
        zeile.addStretch()
        lay.addLayout(zeile)

        hilfe = QLabel(
            "Jede Zeile ist ein Gebiet (im Wald ein Waldstück, in der Stadt ein Dorf). <b>Stapel</b> nimmt den Stapel samt Unterstapeln, "
            "<b>Schlagwort</b> alle Karten mit dem Schlagwort samt Unter-Schlagwörtern (<code>Arbeit</code> "
            "umfasst <code>Arbeit::SEW</code>), <b>Suche</b> eine beliebige Anki-Suche "
            "(z.&nbsp;B. <code>deck:SEW or deck:KUKA</code>).")
        hilfe.setWordWrap(True)
        lay.addWidget(hilfe)

        self.tabelle = QTableWidget(0, 3)
        self.tabelle.setHorizontalHeaderLabels(["Name des Gebiets", "Art", "Stapel / Schlagwort / Suche"])
        kopf = self.tabelle.horizontalHeader()
        kopf.setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        kopf.setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        kopf.setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        self.tabelle.verticalHeader().hide()
        lay.addWidget(self.tabelle)
        for g in self.cfg["gebiete"]:
            self._zeile(g)

        knoepfe = QHBoxLayout()
        for text, fn in (("Gebiet hinzufügen", lambda: self._zeile({})),
                         ("Entfernen", self._entfernen),
                         ("Alle Hauptstapel eintragen", self._hauptstapel)):
            b = QPushButton(text)
            b.clicked.connect(fn)
            knoepfe.addWidget(b)
        knoepfe.addStretch()
        lay.addLayout(knoepfe)

        self.automatisch = QCheckBox("Ist die Liste leer, wird jeder Hauptstapel ein Gebiet")
        self.automatisch.setChecked(bool(self.cfg["hauptstapel_automatisch"]))
        lay.addWidget(self.automatisch)

        zeile = QHBoxLayout()
        zeile.addWidget(QLabel("Höchstens so viele Bäume bzw. Häuser je Gebiet zeichnen:"))
        self.max_baeume = QSpinBox()
        self.max_baeume.setRange(50, 3000)
        self.max_baeume.setSingleStep(50)
        self.max_baeume.setValue(int(self.cfg["max_baeume"]))
        zeile.addWidget(self.max_baeume)
        zeile.addStretch()
        lay.addLayout(zeile)

        zeile = QHBoxLayout()
        self.hintergrund = QCheckBox("Karte als Hintergrund der Stapelübersicht zeigen, Deckkraft:")
        self.hintergrund.setChecked(bool(self.cfg["hintergrund"]))
        zeile.addWidget(self.hintergrund)
        self.deckkraft = QSpinBox()
        self.deckkraft.setRange(5, 100)
        self.deckkraft.setSingleStep(5)
        self.deckkraft.setSuffix(" %")
        self.deckkraft.setValue(int(self.cfg["hintergrund_deckkraft"]))
        self.deckkraft.setEnabled(self.hintergrund.isChecked())
        self.hintergrund.toggled.connect(self.deckkraft.setEnabled)
        zeile.addWidget(self.deckkraft)
        zeile.addStretch()
        lay.addLayout(zeile)

        self.animationen = QCheckBox("Animationen: Vögel, Bewohner, Wolken, Wind und Wachsen beim Öffnen")
        self.animationen.setChecked(bool(self.cfg["animationen"]))
        lay.addWidget(self.animationen)

        box = QDialogButtonBox(QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Cancel)
        box.accepted.connect(self._speichern)
        box.rejected.connect(self.reject)
        lay.addWidget(box)
        self.resize(760, 460)

    def _zeile(self, g):
        r = self.tabelle.rowCount()
        self.tabelle.insertRow(r)
        name = QLineEdit(g.get("name", ""))
        self.tabelle.setCellWidget(r, 0, name)
        art = QComboBox()
        for key, text in ARTEN:
            art.addItem(text, key)
        art.setCurrentIndex(max(0, [k for k, _ in ARTEN].index(g.get("art", "stapel"))))
        self.tabelle.setCellWidget(r, 1, art)
        wert = QComboBox()
        wert.setEditable(True)
        self.tabelle.setCellWidget(r, 2, wert)
        self._auswahl(art, wert, g.get("wert", ""))
        art.currentIndexChanged.connect(lambda _i, a=art, w=wert: self._auswahl(a, w, w.currentText()))
        wert.currentTextChanged.connect(lambda text, n=name: self._name_vorschlagen(n, text))

    def _auswahl(self, art, wert, text):
        wert.blockSignals(True)
        wert.clear()
        wert.addItems({"stapel": self.stapel, "schlagwort": self.schlagwoerter}.get(art.currentData(), []))
        wert.setCurrentText(text)
        wert.blockSignals(False)

    def _name_vorschlagen(self, name, text):
        if not name.text().strip() or name.property("vorschlag"):
            name.setText(text.split("::")[-1])
            name.setProperty("vorschlag", True)

    def _entfernen(self):
        for r in sorted({i.row() for i in self.tabelle.selectedIndexes()} or {self.tabelle.rowCount() - 1},
                        reverse=True):
            if r >= 0:
                self.tabelle.removeRow(r)

    def _hauptstapel(self):
        vorhanden = {g["wert"] for g in self._gebiete() if g["art"] == "stapel"}
        for n in sorted({s.split("::")[0] for s in self.stapel}):
            if n not in vorhanden:
                self._zeile({"name": n, "art": "stapel", "wert": n})

    def _gebiete(self):
        liste = []
        for r in range(self.tabelle.rowCount()):
            name, art, wert = (self.tabelle.cellWidget(r, c) for c in range(3))
            if wert.currentText().strip():
                liste.append({"name": name.text().strip() or wert.currentText().strip(),
                              "art": art.currentData(), "wert": wert.currentText().strip()})
        return liste

    def _speichern(self):
        gebiete = self._gebiete()
        leer = []
        for g in gebiete:
            try:
                if not mw.col.find_cards(daten.suchtext(mw.col, g)):
                    leer.append(g["name"])
            except Exception as e:  # Anki meldet ungültige Suchen als Ausnahme
                showWarning("Gebiet „%s“: Suche ungültig.\n\n%s" % (g["name"], e), parent=self)
                return
        if leer and not askUser("Keine Karten gefunden für: %s.\n\nTrotzdem speichern?" % ", ".join(leer),
                                parent=self):
            return
        self.cfg.update(thema=self.thema.currentData(), gebiete=gebiete,
                        hauptstapel_automatisch=self.automatisch.isChecked(), max_baeume=self.max_baeume.value(),
                        hintergrund=self.hintergrund.isChecked(), hintergrund_deckkraft=self.deckkraft.value(),
                        animationen=self.animationen.isChecked())
        mw.addonManager.writeConfig(__name__, self.cfg)
        from . import beschriftung_aktualisieren  # Knopf heißt wie das Thema (Stadt bzw. Wald)
        beschriftung_aktualisieren()
        if mw.state == "deckBrowser":
            mw.deckBrowser.refresh()
        elif mw.state == "overview":
            mw.overview.refresh()
        self.accept()


def zeigen():
    """Gibt True zurück, wenn gespeichert wurde."""
    return Einstellungen().exec() == QDialog.DialogCode.Accepted
