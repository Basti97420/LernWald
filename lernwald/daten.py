# Lernwald – Anki-Add-on
# Copyright (C) 2026 Basti97420
# Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
"""Berechnet aus der Sammlung, wie Wald oder Stadt aussehen. Ohne Qt, damit es sich testen lässt."""

import random
import zlib

from anki.collection import SearchNode

# Stufen einer Karte, von klein nach groß; dazu die Sonderfälle. Die Themen zeichnen sie verschieden
# (Wald: Sprössling bis dicker Baum, Stadt: Bauplatz bis Turm), die Berechnung ist dieselbe.
STUFEN = ("spross", "setzling", "jung", "baum", "alt", "krank", "stumpf")

JUNG_BIS = 21           # Intervall in Tagen, ab dem eine Karte als reif gilt (wie in Anki)
ALT_AB = 90             # Intervall in Tagen für die größte Stufe
ALT_MAX_FEHLER = 1      # die größte Stufe darf höchstens so oft vergessen worden sein
KRANK_AB_FEHLER = 8     # so oft vergessen = krank bzw. baufällig (Ankis Standard für Leeches)

GESUND_AB = 70          # Gesundheit in Prozent, ab der ein Gebiet als gesund zählt
VERWILDERT_UNTER = 40
MIN_REIFE_FUER_BELOHNUNG = 10   # so viele reife Karten braucht ein gesundes Gebiet für Tiere bzw. Bauten

# Belohnungen je Thema: (Kennung, Name, gesunde Gebiete insgesamt, ab denen sie auftauchen)
THEMEN = {
    "wald": {
        "name": "Wald",
        "belohnungen": (
            ("meise", "Kohlmeise", 1),
            ("eichhoernchen", "Eichhörnchen", 1),
            ("igel", "Igel", 2),
            ("hase", "Feldhase", 2),
            ("specht", "Buntspecht", 3),
            ("fuchs", "Rotfuchs", 3),
            ("reh", "Reh", 4),
            ("dachs", "Dachs", 5),
            ("eule", "Waldkauz", 6),
            ("hirsch", "Rothirsch", 7),
            ("luchs", "Luchs", 8),
            ("wolf", "Wolf", 10),
        ),
    },
    "stadt": {
        "name": "Stadt",
        "belohnungen": (
            ("brunnen", "Dorfbrunnen", 1),
            ("marktstand", "Marktstand", 1),
            ("maibaum", "Maibaum", 2),
            ("windmuehle", "Windmühle", 2),
            ("kapelle", "Kapelle", 3),
            ("rathaus", "Rathaus", 3),
            ("uhrturm", "Uhrturm", 4),
            ("stadttor", "Stadttor", 5),
            ("kirche", "Kirche", 6),
            ("burg", "Burg", 7),
            ("dom", "Dom", 8),
            ("schloss", "Schloss", 10),
        ),
    },
}
TIERE = THEMEN["wald"]["belohnungen"]

STANDARD = {
    "thema": "wald",                # Schlüssel aus THEMEN
    "gebiete": [],                  # [{"name": …, "art": "stapel"|"schlagwort"|"suche", "wert": …}]
    "hauptstapel_automatisch": True,  # ohne Einträge: jeder Hauptstapel ist ein Gebiet
    "max_baeume": 400,              # höchstens so viele Bäume bzw. Häuser je Gebiet zeichnen
}


def einstellungen(roh):
    """Einstellungen mit Standardwerten auffüllen."""
    cfg = dict(STANDARD)
    cfg.update(roh or {})
    cfg["gebiete"] = [g for g in cfg.get("gebiete") or [] if (g.get("wert") or "").strip()]
    if cfg["thema"] not in THEMEN:
        cfg["thema"] = STANDARD["thema"]
    return cfg


def suchtext(col, gebiet):
    """Anki-Suche für ein Gebiet. Stapel und Schlagwörter maskiert Anki selbst (z. B. _ und *)."""
    art, wert = gebiet.get("art", "stapel"), gebiet["wert"].strip()
    if art == "stapel":
        return col.build_search_string(SearchNode(deck=wert))
    if art == "schlagwort":
        return col.build_search_string(SearchNode(tag=wert))
    return wert


def gebiete_festlegen(col, cfg):
    """Liste der Gebiete mit Name und Suche."""
    if cfg["gebiete"]:
        return [{"name": (g.get("name") or g["wert"]).strip(), "suche": suchtext(col, g)} for g in cfg["gebiete"]]
    if not cfg["hauptstapel_automatisch"]:
        return []
    namen = sorted({d.name.split("::")[0] for d in col.decks.all_names_and_ids(skip_empty_default=True)})
    return [{"name": n, "suche": suchtext(col, {"art": "stapel", "wert": n})} for n in namen]


def stufe(typ, queue, ivl, lapses, leech):
    """Stufe einer Karte aus Ankis Feldern."""
    if queue == -1:
        return "stumpf"
    if leech or lapses >= KRANK_AB_FEHLER:
        return "krank"
    if typ == 0:
        return "spross"
    if typ in (1, 3):
        return "setzling"
    if ivl < JUNG_BIS:
        return "jung"
    if ivl >= ALT_AB and lapses <= ALT_MAX_FEHLER:
        return "alt"
    return "baum"


def gesundheit(zahlen, welk):
    """Gesundheit 0–100 aus den Stufen; None, wenn noch nichts gelernt ist."""
    gelernt = sum(zahlen[s] for s in ("setzling", "jung", "baum", "alt", "krank"))
    if not gelernt:
        return None
    reif = (zahlen["baum"] + zahlen["alt"]) / gelernt
    wert = 100 * (0.5 + 0.5 * reif - welk / gelernt - zahlen["krank"] / gelernt)
    return max(0, min(100, round(wert)))


def zustand(gesund):
    if gesund is None:
        return "wiese"
    if gesund >= GESUND_AB:
        return "gesund"
    if gesund < VERWILDERT_UNTER:
        return "verwildert"
    return "mittel"


def _karten(col, ids):
    if not ids:
        return []
    liste = ",".join(str(int(i)) for i in ids)
    return col.db.all(
        "select c.id, c.type, c.queue, c.ivl, c.lapses, c.due, n.tags from cards c "
        "join notes n on n.id = c.nid where c.id in (%s) order by c.id" % liste
    )


def gebiet_berechnen(col, gebiet, heute, max_baeume):
    zahlen = dict.fromkeys(STUFEN, 0)
    welk = 0
    baeume = []
    for _cid, typ, queue, ivl, lapses, due, tags in _karten(col, col.find_cards(gebiet["suche"])):
        s = stufe(typ, queue, ivl, lapses, " leech " in " %s " % tags.lower())
        faellig = queue in (2, 3) and due < heute
        zahlen[s] += 1
        welk += faellig
        baeume.append((s, faellig))
    if len(baeume) > max_baeume:
        # gleichmäßig ausdünnen, damit die Anteile stimmen
        schritt = len(baeume) / max_baeume
        baeume = [baeume[int(i * schritt)] for i in range(max_baeume)]
    g = gesundheit(zahlen, welk)
    return {
        "name": gebiet["name"],
        "karten": sum(zahlen.values()),
        "zahlen": zahlen,
        "welk": welk,
        "gesundheit": g,
        "zustand": zustand(g),
        "baeume": [[s, int(f)] for s, f in baeume],
        "belohnungen": [],
    }


def belohnungen_verteilen(gebiete, liste):
    """Freigeschaltete Tiere bzw. Bauten auf die gesunden Gebiete verteilen. Gibt die Kennungen zurück."""
    gesunde = [g for g in gebiete
               if g["zustand"] == "gesund" and g["zahlen"]["baum"] + g["zahlen"]["alt"] >= MIN_REIFE_FUER_BELOHNUNG]
    frei = [b for b in liste if len(gesunde) >= b[2]]
    if not frei:
        return []
    gesunde.sort(key=lambda g: (-g["gesundheit"], -(g["zahlen"]["baum"] + g["zahlen"]["alt"])))
    # Die seltensten ins gesündeste Gebiet, die übrigen gemischt verteilen
    gesunde[0]["belohnungen"].extend(b[0] for b in frei if b[2] == frei[-1][2])
    for g in gesunde:
        rnd = random.Random(zlib.crc32(g["name"].encode()))
        reif = g["zahlen"]["baum"] + g["zahlen"]["alt"]
        anzahl = min(4, 1 + reif // 50)
        auswahl = [b[0] for b in frei if b[0] not in g["belohnungen"]]
        rnd.shuffle(auswahl)
        g["belohnungen"].extend(auswahl[:max(0, anzahl - len(g["belohnungen"]))])
    reihenfolge = [b[0] for b in liste]
    return sorted({b for g in gesunde for b in g["belohnungen"]}, key=reihenfolge.index)


def wald_berechnen(col, cfg):
    """Alle Daten für die Anzeige."""
    cfg = einstellungen(cfg)
    liste = THEMEN[cfg["thema"]]["belohnungen"]
    heute = col.sched.today
    gebiete = [gebiet_berechnen(col, g, heute, int(cfg["max_baeume"])) for g in gebiete_festlegen(col, cfg)]
    gesichtet = belohnungen_verteilen(gebiete, liste)
    return {
        "thema": cfg["thema"],
        "gebiete": gebiete,
        "gesichtet": gesichtet,
        "gesunde_gebiete": sum(1 for g in gebiete if g["zustand"] == "gesund"),
        "min_reife": MIN_REIFE_FUER_BELOHNUNG,
        "belohnungen": [{"id": b[0], "name": b[1], "ab": b[2]} for b in liste],
    }


def album_ergaenzen(album, gesichtet, datum):
    """Erstsichtungen nachtragen; gibt die neuen zurück. Die Kennungen sind über alle Themen eindeutig."""
    neu = [b for b in gesichtet if b not in album]
    for b in neu:
        album[b] = datum
    return neu
