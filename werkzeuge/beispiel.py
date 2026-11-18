"""Legt eine Beispielsammlung mit Stapeln in verschiedenen Zuständen an (nur zum Testen)."""

import random
import sys

from anki.collection import Collection

# Stapel: (Name, Karten, Anteile neu/lernend/jung/reif/alt, Anteil fällig, Anteil krank, Anteil ausgesetzt)
STAPEL = (
    ("Arbeit::SEW", 260, (0.05, 0.03, 0.12, 0.45, 0.35), 0.02, 0.01, 0.02),
    ("Arbeit::KUKA", 180, (0.08, 0.04, 0.15, 0.45, 0.28), 0.03, 0.01, 0.0),
    ("Keyence", 340, (0.04, 0.02, 0.10, 0.44, 0.40), 0.01, 0.0, 0.01),
    ("Englisch", 420, (0.06, 0.03, 0.10, 0.41, 0.40), 0.02, 0.02, 0.02),
    ("OpenSCAD", 90, (0.05, 0.05, 0.10, 0.50, 0.30), 0.0, 0.0, 0.0),
    ("Desoutter", 120, (0.05, 0.05, 0.12, 0.48, 0.30), 0.02, 0.0, 0.0),
    ("Chemie", 150, (0.10, 0.10, 0.40, 0.30, 0.10), 0.45, 0.08, 0.03),
    ("Spanisch", 200, (1, 0, 0, 0, 0), 0, 0, 0),
    ("Geschichte", 110, (0.15, 0.10, 0.40, 0.30, 0.05), 0.12, 0.03, 0.0),
)


def anlegen(pfad, saat=1):
    return befuellen(Collection(pfad), saat)


def befuellen(col, saat=1):
    rnd = random.Random(saat)
    lang = random.Random(saat + 99)  # eigene Folge für lange Intervalle, damit sich der Rest nicht verschiebt
    basic = col.models.by_name("Basic") or col.models.by_name("Basis") or col.models.current()
    heute = col.sched.today
    for name, anzahl, anteile, faellig, krank, aus in STAPEL:
        did = col.decks.id(name)
        for k in range(anzahl):
            note = col.new_note(basic)
            note.fields[0], note.fields[1] = "%s %d" % (name, k), "Antwort"
            col.add_note(note, did)
            cid = note.card_ids()[0]
            x, art = rnd.random(), 4
            for i, a in enumerate(anteile):
                if x < a:
                    art = i
                    break
                x -= a
            if art == 0:
                continue
            ivl = {1: 0, 2: rnd.randint(1, 20), 3: rnd.randint(21, 89), 4: rnd.randint(90, 400)}[art]
            typ, queue = (1, 1) if art == 1 else (2, 2)
            due = heute - rnd.randint(1, 30) if rnd.random() < faellig else heute + rnd.randint(1, max(ivl, 1))
            lapses = rnd.randint(8, 14) if rnd.random() < krank else rnd.randint(0, 1)
            if rnd.random() < aus:
                queue = -1
            if art == 4 and lang.random() < 0.5:  # bis fast 3 Jahre: Hochhäuser und Wolkenkratzer
                ivl = lang.randint(400, 1000)
            if art == 1:
                due = 0
            col.db.execute("update cards set type=?, queue=?, ivl=?, due=?, lapses=? where id=?",
                           typ, queue, ivl, due, lapses, cid)
    # Schlagwörter zum Testen von Gebieten nach Schlagwort: Hierarchie, Groß/klein, Unterstrich, Lockvogel
    for stapel, tag in (("Arbeit::SEW", "Arbeit::SEW"), ("Arbeit::KUKA", "Arbeit::KUKA"), ("Desoutter", "arbeit"),
                        ("Keyence", "Keyence_XG"), ("OpenSCAD", "KeyenceAXG"),
                        ("Englisch", "Sprachen::Englisch"), ("Spanisch", "Sprachen::Spanisch")):
        col.tags.bulk_add(col.find_notes('deck:"%s"' % stapel), tag)
    wiederholungen_anlegen(col, rnd)
    return col


# Lernverlauf je Stapel: (Trefferquote, Tage seit dem letzten Lernen)
VERLAUF = {"Chemie": (0.72, 20), "Geschichte": (0.78, 3), "Spanisch": (None, None)}


def wiederholungen_anlegen(col, rnd, tage=240):
    """revlog füllen: an den meisten Tagen gelernt, die letzten 23 Tage ohne Lücke."""
    cutoff = col.sched.day_cutoff
    gelernt = [t for t in range(tage) if t < 23 or rnd.random() < 0.7]
    zeilen = []
    for name, *_ in STAPEL:
        quote, pause = VERLAUF.get(name, (0.9, 0))
        if quote is None:
            continue
        cids = col.find_cards('deck:"%s" -is:new' % name)
        for t in gelernt:
            if t < pause:
                continue
            for k in range(rnd.randint(3, 12)):
                stunde = rnd.choice((7, 8, 12, 19, 20, 21))
                rid = int((cutoff - (t + 1) * 86400 + (stunde - 4) * 3600 + rnd.random() * 3000) * 1000)
                typ = 0 if rnd.random() < 0.1 else 1
                ease = 1 if rnd.random() > quote else rnd.choice((2, 3, 3, 3, 4))
                zeilen.append((rid, rnd.choice(cids), ease, typ, rnd.randint(3000, 15000)))
    zeilen.sort()
    vorher = 0
    for rid, cid, ease, typ, dauer in zeilen:
        rid = max(rid, vorher + 1)  # IDs eindeutig
        vorher = rid
        col.db.execute("insert into revlog (id, cid, usn, ease, ivl, lastIvl, factor, time, type) "
                       "values (?, ?, -1, ?, 1, 1, 2500, ?, ?)", rid, cid, ease, dauer, typ)


if __name__ == "__main__":
    anlegen(sys.argv[1]).close()
