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

    def test_hintergrund_einstellungen(self):
        self.assertTrue(daten.einstellungen({})["hintergrund"])
        self.assertEqual(daten.einstellungen({})["hintergrund_deckkraft"], 35)
        self.assertEqual(daten.einstellungen({"hintergrund_deckkraft": 0})["hintergrund_deckkraft"], 5)
        self.assertEqual(daten.einstellungen({"hintergrund_deckkraft": 250})["hintergrund_deckkraft"], 100)
        self.assertEqual(daten.einstellungen({"hintergrund_deckkraft": "viel"})["hintergrund_deckkraft"], 35)
        self.assertTrue(daten.einstellungen({})["animationen"])

    def test_belohnungen_eindeutig(self):
        # das Album ist ein gemeinsames Wörterbuch für alle Themen
        # Themen, die dieselbe Liste teilen (Stadt und Tusche-Stadt), zählen einmal
        listen = {id(t["belohnungen"]): t["belohnungen"] for t in daten.THEMEN.values()}
        ids = [b[0] for liste in listen.values() for b in liste]
        self.assertEqual(len(ids), len(set(ids)))
        for t in daten.THEMEN.values():
            schwellen = [b[2] for b in t["belohnungen"]]
            self.assertEqual(schwellen, sorted(schwellen))

    def test_hoehe_und_sicherheit(self):
        self.assertEqual(daten.hoehe("baum", 800, 0), 0)    # nur die größte Stufe wächst in die Höhe
        self.assertEqual(daten.hoehe("alt", 100, 0), 0)
        self.assertEqual(daten.hoehe("alt", 200, 1), 1)     # Hochhaus
        self.assertEqual(daten.hoehe("alt", 400, 1), 1)     # einmal vergessen: nicht höher
        self.assertEqual(daten.hoehe("alt", 400, 0), 2)
        self.assertEqual(daten.hoehe("alt", 800, 0), 3)     # Wolkenkratzer
        zahlen = dict.fromkeys(daten.STUFEN, 0)
        self.assertIsNone(daten.sicherheit(zahlen))
        zahlen.update(spross=2, baum=3, alt=3, stumpf=10)   # ausgesetzte zählen nicht
        self.assertEqual(daten.sicherheit(zahlen), 75)

    def test_serie_und_tageszeit(self):
        self.assertEqual(daten._serie({0: 3, 1: 2, 2: 1, 4: 1}), 3)
        self.assertEqual(daten._serie({1: 2, 2: 1}), 2)      # heute noch nicht gelernt: Serie läuft weiter
        self.assertEqual(daten._serie({2: 1}), 0)
        self.assertEqual(daten.tageszeit([20, 21, 8]), "abend")
        self.assertIsNone(daten.tageszeit([]))

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
        self.assertEqual(len(arbeit["hoch"]), 3)
        self.assertTrue(any(b[2] == 3 for b in arbeit["baeume"]))   # Wolkenkratzer in der Beispielsammlung
        self.assertTrue(0 < arbeit["sicherheit"] <= 100)
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

    def test_chronik(self):
        wald = daten.wald_berechnen(self.col, {"thema": "tusche"})
        c = wald["chronik"]
        self.assertEqual(len(c["tage"]), daten.CHRONIK_TAGE)
        self.assertEqual(c["serie"], 23)                    # Beispiel: die letzten 23 Tage ohne Lücke
        self.assertEqual(c["wiederholungen"], sum(c["tage"]))   # Verlauf ist kürzer als die Chronik
        self.assertTrue(80 <= c["quote"] <= 95)
        arten = [(m["art"], m["wert"]) for m in c["meilensteine"]]
        self.assertIn(("wiederholungen", 1000), arten)
        self.assertIn(("serie", 7), arten)
        g = {x["name"]: x["chronik"] for x in wald["gebiete"]}
        self.assertEqual(g["Chemie"]["pause"], 20)
        self.assertEqual(g["Chemie"]["heute"], 0)
        self.assertLess(g["Chemie"]["quote"], 80)           # Regen
        self.assertEqual(g["Spanisch"], {"lerntage": 0, "heute": 0, "pause": None, "quote": None, "serie": 0})
        self.assertEqual(g["Arbeit"]["serie"], 23)
        self.assertGreater(g["Arbeit"]["heute"], 0)

    def test_manuelle_eintraege_zaehlen_nicht(self):
        cid = self.col.find_cards("deck:Spanisch")[0]
        rid = (self.col.sched.day_cutoff - 3600) * 1000
        self.col.db.execute("insert into revlog values (?, ?, -1, 0, 0, 0, 0, 0, 4)", rid, cid)
        wald = daten.wald_berechnen(self.col, {})
        self.assertEqual({x["name"]: x["chronik"] for x in wald["gebiete"]}["Spanisch"]["lerntage"], 0)
        self.col.db.execute("delete from revlog where id = ?", rid)

    def test_ohne_automatik_leer(self):
        self.assertEqual(daten.wald_berechnen(self.col, {"hauptstapel_automatisch": False})["gebiete"], [])


if __name__ == "__main__":
    unittest.main()
