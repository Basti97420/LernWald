# Lernwald – Anki-Add-on
# Copyright (C) 2026 Basti97420
# Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
"""Berechnet aus der Sammlung, wie Wald oder Stadt aussehen. Ohne Qt, damit es sich testen lässt."""

import datetime
import random
import time
import zlib

from anki.collection import SearchNode

# Stufen einer Karte, von klein nach groß; dazu die Sonderfälle. Die Themen zeichnen sie verschieden
# (Wald: Sprössling bis dicker Baum, Stadt: Bauplatz bis Turm), die Berechnung ist dieselbe.
STUFEN = ("spross", "setzling", "jung", "baum", "alt", "krank", "stumpf")

JUNG_BIS = 21           # Intervall in Tagen, ab dem eine Karte als reif gilt (wie in Anki)
ALT_AB = 90             # Intervall in Tagen für die größte Stufe
ALT_MAX_FEHLER = 1      # die größte Stufe darf höchstens so oft vergessen worden sein
KRANK_AB_FEHLER = 8     # so oft vergessen = krank bzw. baufällig (Ankis Standard für Leeches)
# Über der größten Stufe wächst ein Haus weiter, je länger das Intervall (also je öfter die Karte hintereinander
# richtig war): (Intervall ab, höchstens so oft vergessen) für Hochhaus, hohes Hochhaus, Wolkenkratzer
HOCH_AB = ((180, 1), (365, 0), (730, 0))
# Einwohner je Haus nach Stufe; Hochhäuser nach Höhe. Ein Haus mit fälliger Karte zählt nur halb.
BEWOHNER = {"spross": 0, "setzling": 0, "jung": 1, "baum": 3, "alt": 6, "krank": 1, "stumpf": 0}
BEWOHNER_HOCH = (12, 25, 50)

GESUND_AB = 70          # Gesundheit in Prozent, ab der ein Gebiet als gesund zählt
VERWILDERT_UNTER = 40
MIN_REIFE_FUER_BELOHNUNG = 10   # so viele reife Karten braucht ein gesundes Gebiet für Tiere bzw. Bauten

# Belohnungen je Thema: (Kennung, Name, gesunde Gebiete insgesamt, ab denen sie auftauchen)
THEMEN = {
    "wald": {
        "name": "Wald",
        "knopf": "Wald",  # Beschriftung in Ankis oberer Leiste und im Menü
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
        "knopf": "Stadt",
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
# Tusche-Stadt: dieselbe Stadt, gezeichnet wie ein Kupferstich; teilt sich die Sehenswürdigkeiten mit „stadt“
THEMEN["tusche"] = {"name": "Tusche-Stadt", "knopf": "Stadt", "belohnungen": THEMEN["stadt"]["belohnungen"]}
TIERE = THEMEN["wald"]["belohnungen"]

CHRONIK_TAGE = 371      # so viele Tage zeigt die Chronik (53 Wochen)
QUOTE_TAGE = 30         # Zeitraum für die Trefferquote
MEILENSTEINE = (
    ("wiederholungen", (100, 1000, 5000, 10000, 25000, 50000, 100000)),
    ("lerntage", (10, 50, 100, 200, 365, 500, 1000)),
    ("serie", (7, 30, 100, 200, 365)),
)

STANDARD = {
    "thema": "wald",                # Schlüssel aus THEMEN
    "gebiete": [],                  # [{"name": …, "art": "stapel"|"schlagwort"|"suche", "wert": …}]
    "hauptstapel_automatisch": True,  # ohne Einträge: jeder Hauptstapel ist ein Gebiet
    "max_baeume": 400,              # höchstens so viele Bäume bzw. Häuser je Gebiet zeichnen
    "hintergrund": True,            # Karte blass hinter der Stapelübersicht zeigen
    "hintergrund_deckkraft": 35,    # in Prozent, 5 bis 100
    "animationen": True,            # Vögel, Bewohner, Wolken, Wind … bewegen sich
}


def einstellungen(roh):
    """Einstellungen mit Standardwerten auffüllen."""
    cfg = dict(STANDARD)
    cfg.update(roh or {})
    cfg["gebiete"] = [g for g in cfg.get("gebiete") or [] if (g.get("wert") or "").strip()]
    if cfg["thema"] not in THEMEN:
        cfg["thema"] = STANDARD["thema"]
    try:
        cfg["hintergrund_deckkraft"] = min(100, max(5, int(cfg["hintergrund_deckkraft"])))
    except (TypeError, ValueError):
        cfg["hintergrund_deckkraft"] = STANDARD["hintergrund_deckkraft"]
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


def hoehe(s, ivl, lapses):
    """Wie hoch ein Haus über der größten Stufe hinaus wächst: 0 (normal) bis len(HOCH_AB)."""
    if s != "alt":
        return 0
    return sum(1 for ab, fehler in HOCH_AB if ivl >= ab and lapses <= fehler)


def bewohner(s, h, faellig):
    """Einwohner eines Hauses (Karte); fällige zählen halb."""
    n = BEWOHNER_HOCH[h - 1] if h else BEWOHNER[s]
    return n / 2 if faellig else n


def aufstieg(s, h, ivl, lapses, factor):
    """Welche Stufe ein Haus beim nächsten richtigen Wiederholen voraussichtlich erreicht, sonst None.
    Abgeschätzt aus Intervall mal Ease (ohne Zufallsstreuung und Bonus): "haus", "stadthaus" oder 1–3 (Hochhaus)."""
    if s not in ("jung", "baum", "alt"):
        return None
    neu = ivl * (factor or 2500) / 1000
    if s == "jung":
        return "haus" if neu >= JUNG_BIS else None
    if s == "baum":
        return "stadthaus" if neu >= ALT_AB and lapses <= ALT_MAX_FEHLER else None
    if h < len(HOCH_AB):
        ab, fehler = HOCH_AB[h]
        if neu >= ab and lapses <= fehler:
            return h + 1
    return None


def sicherheit(zahlen):
    """Wie sicher ein Gebiet sitzt, 0–100: Anteil reifer Karten an allen (ohne ausgesetzte); None ohne Karten."""
    alle = sum(zahlen[s] for s in STUFEN if s != "stumpf")
    return round(100 * (zahlen["baum"] + zahlen["alt"]) / alle) if alle else None


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
        "select c.id, c.type, c.queue, c.ivl, c.lapses, c.due, n.tags, c.factor from cards c "
        "join notes n on n.id = c.nid where c.id in (%s) order by c.id" % liste
    )


def gebiet_berechnen(col, gebiet, heute, max_baeume):
    zahlen = dict.fromkeys(STUFEN, 0)
    hoch = [0] * len(HOCH_AB)  # Hochhäuser je Höhe
    bald = {"haus": 0, "stadthaus": 0, "hochhaus": [0] * len(HOCH_AB)}  # Aufstiege beim nächsten Wiederholen
    einwohner = 0
    welk = 0
    baeume = []
    cids = col.find_cards(gebiet["suche"])
    for _cid, typ, queue, ivl, lapses, due, tags, factor in _karten(col, cids):
        s = stufe(typ, queue, ivl, lapses, " leech " in " %s " % tags.lower())
        faellig = queue in (2, 3) and due < heute
        h = hoehe(s, ivl, lapses)
        zahlen[s] += 1
        welk += faellig
        if h:
            hoch[h - 1] += 1
        einwohner += bewohner(s, h, faellig)
        a = aufstieg(s, h, ivl, lapses, factor)
        if isinstance(a, int):
            bald["hochhaus"][a - 1] += 1
        elif a:
            bald[a] += 1
        baeume.append((s, faellig, h))
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
        "baeume": [[s, int(f), h] for s, f, h in baeume],  # Stufe, fällig, Höhe
        "hoch": hoch,
        "einwohner": round(einwohner),
        "bald": bald,
        "sicherheit": sicherheit(zahlen),
        "belohnungen": [],
        "_cids": set(cids),
    }


def _tag(rid, cutoff):
    """Tage vor heute (0 = heute) für eine revlog-ID, mit Ankis Tagesgrenze."""
    return int((cutoff - rid / 1000) // 86400)


def _serie(tage, ab=0):
    """Tage in Folge mit Wiederholungen, rückwärts ab Tag `ab`; heute ohne Lernen bricht die Serie noch nicht."""
    if ab == 0 and not tage.get(0):
        ab = 1
    n = 0
    while tage.get(ab + n):
        n += 1
    return n


def tageszeit(stunden):
    """Wann meistens gelernt wird: morgen, tag, abend oder nacht; None ohne Wiederholungen."""
    if not stunden:
        return None
    zaehler = {}
    for h in stunden:
        z = "morgen" if 5 <= h < 11 else "tag" if h < 17 and h >= 11 else "abend" if 17 <= h < 23 else "nacht"
        zaehler[z] = zaehler.get(z, 0) + 1
    return max(zaehler, key=zaehler.get)


def chronik_berechnen(col, gebiete_cids, heute_datum=None):
    """Statistik aus dem revlog: für die ganze Sammlung und je Gebiet.

    gebiete_cids: je Gebiet eine Menge Karten-IDs. Manuelle Einträge (ease 0) zählen nicht.
    """
    heute_datum = heute_datum or datetime.date.today()
    cutoff = col.sched.day_cutoff
    karte_zu = {}
    for i, cids in enumerate(gebiete_cids):
        for c in cids:
            karte_zu.setdefault(c, []).append(i)
    tage = {}                                   # Tag → Wiederholungen
    zeit_heute = 0
    treffer = versuche = 0
    stunden = []
    je = [{"tage": set(), "heute": 0, "treffer": 0, "versuche": 0, "letzter": None} for _ in gebiete_cids]
    for rid, cid, ease, typ, dauer in col.db.all("select id, cid, ease, type, time from revlog where ease > 0 order by id"):
        t = _tag(rid, cutoff)
        tage[t] = tage.get(t, 0) + 1
        quote = typ == 1 and t < QUOTE_TAGE
        if t == 0:
            zeit_heute += dauer
        if quote:
            versuche += 1
            treffer += ease > 1
        if t < QUOTE_TAGE:
            stunden.append(time.localtime(rid / 1000).tm_hour)
        for i in karte_zu.get(cid, ()):
            g = je[i]
            g["tage"].add(t)
            g["heute"] += t == 0
            g["letzter"] = t
            if quote:
                g["versuche"] += 1
                g["treffer"] += ease > 1
    # neue Karten heute: erste Wiederholung überhaupt liegt heute
    neu_heute = col.db.scalar(
        "select count() from (select min(id) m from revlog where ease > 0 group by cid) where m > ?",
        (cutoff - 86400) * 1000)
    morgen = len(col.find_cards("prop:due=1"))
    # Meilensteine: erster Tag, an dem die Schwelle erreicht war (Tage rückwärts durchlaufen = vorwärts in der Zeit)
    erreicht = []
    summe = lerntage = serie = beste = 0
    for t in sorted(tage, reverse=True):
        summe += tage[t]
        lerntage += 1
        serie = serie + 1 if tage.get(t + 1) else 1
        beste = max(beste, serie)
        werte = {"wiederholungen": summe, "lerntage": lerntage, "serie": serie}
        for art, schwellen in MEILENSTEINE:
            for sw in schwellen:
                if werte[art] >= sw and not any(m["art"] == art and m["wert"] == sw for m in erreicht):
                    erreicht.append({"art": art, "wert": sw, "datum": (heute_datum - datetime.timedelta(days=t)).isoformat()})
    offen = []
    for art, schwellen in MEILENSTEINE:
        jetzt_wert = {"wiederholungen": summe, "lerntage": lerntage, "serie": _serie(tage)}[art]
        naechste = [sw for sw in schwellen if sw > max([m["wert"] for m in erreicht if m["art"] == art] or [0])]
        if naechste:
            offen.append({"art": art, "wert": naechste[0], "stand": jetzt_wert})
    gesamt = {
        "tage": [tage.get(t, 0) for t in range(CHRONIK_TAGE)],   # Index 0 = heute
        "heute": tage.get(0, 0),
        "minuten_heute": round(zeit_heute / 60000),
        "neu_heute": neu_heute,
        "morgen": morgen,
        "serie": _serie(tage),
        "beste_serie": beste,
        "lerntage": lerntage,
        "wiederholungen": summe,
        "quote": round(100 * treffer / versuche) if versuche >= 10 else None,
        "tageszeit": tageszeit(stunden),
        "meilensteine": erreicht,
        "naechste": offen,
        "wochentag": heute_datum.weekday(),
        "datum": heute_datum.isoformat(),
    }
    gebiete = [{
        "lerntage": len(g["tage"]),
        "heute": g["heute"],
        "pause": g["letzter"],                        # Tage seit dem letzten Lernen, None = nie
        "quote": round(100 * g["treffer"] / g["versuche"]) if g["versuche"] >= 10 else None,
        "serie": _serie(dict.fromkeys(g["tage"], 1)),
    } for g in je]
    return gesamt, gebiete


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
    chronik, je = chronik_berechnen(col, [g.pop("_cids") for g in gebiete])
    for g, c in zip(gebiete, je):
        g["chronik"] = c
    return {
        "thema": cfg["thema"],
        "gebiete": gebiete,
        "gesichtet": gesichtet,
        "gesunde_gebiete": sum(1 for g in gebiete if g["zustand"] == "gesund"),
        "min_reife": MIN_REIFE_FUER_BELOHNUNG,
        "belohnungen": [{"id": b[0], "name": b[1], "ab": b[2]} for b in liste],
        "chronik": chronik,
        "animationen": bool(cfg["animationen"]),
    }


def album_ergaenzen(album, gesichtet, datum):
    """Erstsichtungen nachtragen; gibt die neuen zurück. Die Kennungen sind über alle Themen eindeutig."""
    neu = [b for b in gesichtet if b not in album]
    for b in neu:
        album[b] = datum
    return neu
