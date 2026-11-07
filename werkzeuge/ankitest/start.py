"""Startet Anki ohne die Sprachauswahl beim ersten Start (für Tests ohne Bildschirm)."""

import sys

import aqt
import aqt.profiles

aqt.profiles.ProfileManager.setDefaultLang = lambda self, idx: self.setLang("de_DE")
sys.argv = ["anki"] + sys.argv[1:]
aqt.run()
