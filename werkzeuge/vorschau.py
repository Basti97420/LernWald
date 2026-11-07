"""Baut aus der Beispielsammlung eine HTML-Vorschau, die ohne Anki im Browser läuft."""

import json
import os
import sys
import tempfile

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HIER, ".."))

from lernwald import daten  # noqa: E402
from beispiel import anlegen  # noqa: E402


def main(ziel, cfg=None):
    with tempfile.TemporaryDirectory() as tmp:
        col = anlegen(os.path.join(tmp, "beispiel.anki2"))
        wald = daten.wald_berechnen(col, cfg or {})
        col.close()
    album = {t: "2026-11-0%d" % (i % 7 + 1) for i, t in enumerate(wald["gesichtet"])}
    wald.update(album=album, neu=wald["gesichtet"][-2:])
    web = os.path.join(HIER, "..", "lernwald", "web")
    with open(os.path.join(web, "lernwald.css"), encoding="utf-8") as f:
        css = f.read()
    from lernwald.ansicht import SKRIPTE
    js = ""
    for name in SKRIPTE:
        with open(os.path.join(web, name), encoding="utf-8") as f:
            js += f.read() + "\n"
    roh = json.dumps(wald, ensure_ascii=False).replace("</", "<\\/")
    with open(ziel, "w", encoding="utf-8") as f:
        f.write('<!doctype html><html><head><meta charset="utf-8"><title>Lernwald – Vorschau</title>'
                '<style>%s</style></head><body><script>%s</script><div id="lernwald"></div>'
                '<script type="application/json" id="lernwald-daten">%s</script>'
                '<script>document.addEventListener("DOMContentLoaded", function () {'
                ' var h = location.hash.slice(1); if (h === "album") lernwald.zeigeAlbum();'
                ' else if (h) lernwald.zeigeGebiet(+h); });</script></body></html>' % (css, js, roh))
    return wald


if __name__ == "__main__":
    # Aufruf: vorschau.py ZIEL.html [THEMA]
    w = main(sys.argv[1] if len(sys.argv) > 1 else "vorschau.html", {"thema": sys.argv[2] if len(sys.argv) > 2 else "wald"})
    for g in w["gebiete"]:
        print("%-12s %4d Karten  %-10s %s  Belohnungen: %s" % (g["name"], g["karten"], g["zustand"], g["gesundheit"], ", ".join(g["belohnungen"])))
