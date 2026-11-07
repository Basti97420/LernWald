"""Packt das Add-on als .ankiaddon für AnkiWeb: ohne obersten Ordner, ohne __pycache__ und ohne Album."""

import json
import os
import sys
import zipfile

HIER = os.path.dirname(os.path.abspath(__file__))
QUELLE = os.path.join(HIER, "..", "lernwald")
AUSLASSEN = ("meta.json", os.path.join("user_files", "album.json"))


def main(ziel_ordner):
    with open(os.path.join(QUELLE, "manifest.json"), encoding="utf-8") as f:
        version = json.load(f).get("version", "0")
    os.makedirs(ziel_ordner, exist_ok=True)
    ziel = os.path.join(ziel_ordner, "lernwald-%s.ankiaddon" % version)
    with zipfile.ZipFile(ziel, "w", zipfile.ZIP_DEFLATED) as z:
        for ordner, unter, dateien in os.walk(QUELLE):
            unter[:] = [u for u in unter if u != "__pycache__"]
            for d in sorted(dateien):
                pfad = os.path.join(ordner, d)
                rel = os.path.relpath(pfad, QUELLE)
                if rel not in AUSLASSEN and not d.endswith(".pyc"):
                    z.write(pfad, rel)
    return ziel


if __name__ == "__main__":
    print(main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HIER, "..", "dist")))
