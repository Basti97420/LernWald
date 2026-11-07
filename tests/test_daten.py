"""Tests für die Berechnung (ohne Qt). Aufruf: .venv/bin/python -m unittest discover tests"""

import os
import sys
import tempfile
import unittest

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [os.path.join(HIER, ".."), os.path.join(HIER, "..", "werkzeuge")]

from beispiel import anlegen  # noqa: E402
from lernwald import daten  # noqa: E402


class Stufen(unittest.TestCase):
    def test_stufen(self):
        self.assertEqual(daten.stufe(0, 0, 0, 0, False), "spross")
        self.assertEqual(daten.stufe(1, 1, 0, 0, False), "setzling")
        self.assertEqual(daten.stufe(3, 1, 0, 2, False), "setzling")
        self.assertEqual(daten.stufe(2, 2, 20, 0, False), "jung")
        self.assertEqual(daten.stufe(2, 2, 21, 0, False), "baum")
        self.assertEqual(daten.stufe(2, 2, 90, 1, False), "alt")
        self.assertEqual(daten.stufe(2, 2, 90, 2, False), "baum")
        self.assertEqual(daten.stufe(2, 2, 90, 8, False), "krank")
        self.assertEqual(daten.stufe(2, 2, 5, 0, True), "krank")
        self.assertEqual(daten.stufe(2, -1, 200, 0, True), "stumpf")

    def test_gesundheit(self):
        z = dict.fromkeys(daten.STUFEN, 0)
        self.assertIsNone(daten.gesundheit(dict(z, spross=10), 0))
        self.assertEqual(daten.gesundheit(dict(z, alt=10), 0), 100)
        self.assertEqual(daten.gesundheit(dict(z, jung=10), 0), 50)
        self.assertEqual(daten.gesundheit(dict(z, jung=10), 10), 0)

    def test_einstellungen(self):
        self.assertEqual(daten.einstellungen({})["thema"], "wald")
        self.assertEqual(daten.einstellungen({"thema": "stadt"})["thema"], "stadt")
        self.assertEqual(daten.einstellungen({"thema": "mond"})["thema"], "wald")

    def test_belohnungen_eindeutig(self):
        # das Album ist ein gemeinsames Wörterbuch für alle Themen
        ids = [b[0] for t in daten.THEMEN.values() for b in t["belohnungen"]]
        self.assertEqual(len(ids), len(set(ids)))
        for t in daten.THEMEN.values():
            schwellen = [b[2] for b in t["belohnungen"]]
            self.assertEqual(schwellen, sorted(schwellen))

    def test_album(self):
        album = {"meise": "2026-11-01"}
        self.assertEqual(daten.album_ergaenzen(album, ["meise", "reh"], "2026-11-07"), ["reh"])
        self.assertEqual(album, {"meise": "2026-11-01", "reh": "2026-11-07"})


class Sammlung(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.col = anlegen(os.path.join(cls.tmp.name, "t.anki2"))

    @classmethod
    def tearDownClass(cls):
        cls.col.close()
        cls.tmp.cleanup()

    def test_hauptstapel_automatisch(self):
        wald = daten.wald_berechnen(self.col, {})
        namen = [g["name"] for g in wald["gebiete"]]
        self.assertIn("Arbeit", namen)
        self.assertNotIn("Default", namen)
        arbeit = wald["gebiete"][namen.index("Arbeit")]
        self.assertEqual(arbeit["karten"], 440)  # SEW und KUKA zusammen
        self.assertEqual(sum(arbeit["zahlen"].values()), 440)
        self.assertLessEqual(len(arbeit["baeume"]), 400)
        self.assertEqual(wald["gebiete"][namen.index("Spanisch")]["zustand"], "wiese")
        self.assertEqual(wald["gebiete"][namen.index("Chemie")]["zustand"], "verwildert")

    def karten(self, gebiete):
        wald = daten.wald_berechnen(self.col, {"gebiete": gebiete})
        return [(g["name"], g["karten"]) for g in wald["gebiete"]]

    def test_eigene_gebiete(self):
        self.assertEqual(self.karten([
            {"name": "SEW", "art": "stapel", "wert": "Arbeit::SEW"},
            {"name": "Zwei", "art": "suche", "wert": "deck:Keyence or deck:OpenSCAD"},
            {"name": "leer", "art": "stapel", "wert": "  "},
        ]), [("SEW", 260), ("Zwei", 430)])

    def test_schlagwoerter_als_gebiete(self):
        sw = lambda wert: {"name": wert, "art": "schlagwort", "wert": wert}  # noqa: E731
        self.assertEqual(self.karten([
            sw("Arbeit"),             # Arbeit::SEW + Arbeit::KUKA + arbeit (Groß/klein egal)
            sw("Arbeit::SEW"),        # nur das Unter-Schlagwort
            sw("arbeit::kuka"),
            sw("Keyence_XG"),         # _ ist hier kein Platzhalter: KeyenceAXG gehört nicht dazu
            sw("Sprachen"),
            sw("gibtsnicht"),
        ]), [("Arbeit", 560), ("Arbeit::SEW", 260), ("arbeit::kuka", 180), ("Keyence_XG", 340),
             ("Sprachen", 620), ("gibtsnicht", 0)])

    def test_schlagwort_gebiet_zustand(self):
        wald = daten.wald_berechnen(self.col, {"gebiete": [
            {"name": "Sprachen", "art": "schlagwort", "wert": "Sprachen"},
            {"name": "Leer", "art": "schlagwort", "wert": "gibtsnicht"}]})
        sprachen, leer = wald["gebiete"]
        self.assertEqual(sprachen["zahlen"]["spross"] >= 200, True)  # Spanisch ist ganz neu
        self.assertEqual(leer["zustand"], "wiese")
        self.assertEqual(leer["baeume"], [])

    def test_stapel_mit_sonderzeichen(self):
        did = self.col.decks.id("C++ (Kurs)_1")
        note = self.col.new_note(self.col.models.current())
        note.fields[0] = "x"
        self.col.add_note(note, did)
        self.assertEqual(self.karten([{"name": "C", "art": "stapel", "wert": "C++ (Kurs)_1"}]), [("C", 1)])
        self.col.remove_notes([note.id])
        self.col.decks.remove([did])

    def test_thema_stadt(self):
        wald = daten.wald_berechnen(self.col, {"thema": "stadt"})
        self.assertEqual(wald["thema"], "stadt")
        ids = {b[0] for b in daten.THEMEN["stadt"]["belohnungen"]}
        self.assertEqual({b["id"] for b in wald["belohnungen"]}, ids)
        self.assertTrue(wald["gesichtet"])
        self.assertTrue(set(wald["gesichtet"]) <= ids)
        for g in wald["gebiete"]:
            self.assertTrue(set(g["belohnungen"]) <= ids)

    def test_tiere_nur_in_gesunden_gebieten(self):
        wald = daten.wald_berechnen(self.col, {})
        for g in wald["gebiete"]:
            if g["belohnungen"]:
                self.assertEqual(g["zustand"], "gesund")
        frei = {t[0] for t in daten.TIERE if t[2] <= wald["gesunde_gebiete"]}
        self.assertTrue(set(wald["gesichtet"]) <= frei)
        self.assertIn("meise", frei)

    def test_ohne_automatik_leer(self):
        self.assertEqual(daten.wald_berechnen(self.col, {"hauptstapel_automatisch": False})["gebiete"], [])


if __name__ == "__main__":
    unittest.main()
